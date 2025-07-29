"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, LayoutGrid, List, Plus, Car, User, Clock, CheckCircle, Users, Trash2, Mail, Send, Copy, Check, ArrowUp, ArrowDown, Menu, Calculator, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { getTimeTrackingByCaseId } from '../lib/api';

interface CaseData {
  _id: string
  status: string
  currentStage: number
  priority: string
  createdAt: string
  updatedAt?: string
  lastActivity?: {
    timestamp: string
  }
  customer?: {
    firstName: string
    lastName: string
    cellPhone: string
  }
  vehicle?: {
    year: string
    make: string
    model: string
    vin?: string
    mileage?: string
  }
  quote?: {
    offerAmount?: number
    offerDecision?: {
      finalAmount?: number
    }
  }
  transaction?: {
    billOfSale?: {
      salePrice?: number
    }
  }
  estimatedValue?: number
}

const stages = [
  { id: 1, name: "Customer Intake", color: "bg-blue-100 text-blue-800" },
  { id: 2, name: "Schedule Inspection", color: "bg-purple-100 text-purple-800" },
  { id: 3, name: "Vehicle Inspection", color: "bg-orange-100 text-orange-800" },
  { id: 4, name: "Quote Preparation", color: "bg-yellow-100 text-yellow-800" },
  { id: 5, name: "Offer Decision", color: "bg-pink-100 text-pink-800" },
  { id: 6, name: "Paperwork", color: "bg-indigo-100 text-indigo-800" },
  { id: 7, name: "Completion", color: "bg-green-100 text-green-800" },
  { id: 8, name: "Completion", color: "bg-green-100 text-green-800" },
]

// New status mapping based on current stage
const getStatusFromStage = (currentStage: number, status: string) => {
  if (status === "completed") return "Completed"
  if (status === "quote-declined") return "Offer Declined / Closed"
  if (status === "cancelled") return "Offer Declined / Closed"
  
  switch (currentStage) {
    case 1:
    case 2:
      return "Pending Inspection"
    case 3:
      return "Pending Inspection"
    case 4:
      return "Pending Quote"
    case 5:
      return "Pending Offer Decision"
    case 6:
      return "Pending Paperwork"
    case 7:
      return "Pending Completion"
    case 8:
      return "Completed"
    default:
      return "Pending Inspection"
  }
}

const getStatusBadgeColor = (status: string) => {
  const statusConfig = {
    "Pending Inspection": "bg-yellow-100 text-yellow-800",
    "Pending Quote": "bg-blue-100 text-blue-800",
    "Pending Offer Decision": "bg-purple-100 text-purple-800",
    "Pending Paperwork": "bg-indigo-100 text-indigo-800",
    "Pending Completion": "bg-pink-100 text-pink-800",
    "Completed": "bg-green-100 text-green-800",
    "Offer Declined / Closed": "bg-red-100 text-red-800",
  }
  return statusConfig[status as keyof typeof statusConfig] || "bg-gray-100 text-gray-800"
}

// Helper to map status query param to dashboard display value
const mapStatusParamToDisplay = (param: string) => {
  const normalized = param.trim().toLowerCase();
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'scheduled') return 'Pending Inspection';
  if (normalized === 'inspection') return 'Pending Inspection';
  if (normalized === 'quote-ready') return 'Pending Quote';
  if (normalized === 'decision') return 'Pending Offer Decision';
  if (normalized === 'paperwork') return 'Pending Paperwork';
  if (normalized === 'quote-declined') return 'Offer Declined / Closed';
  if (normalized === 'cancelled') return 'Offer Declined / Closed';
  return param;
};

export function EstimatorDashboard() {
  const [viewMode, setViewMode] = useState<"cards" | "list">("list")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [cases, setCases] = useState<CaseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAdmin } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  // Add state to store time tracking data
  const [caseTimes, setCaseTimes] = useState<Record<string, number>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await api.getEstimatorCases();
        if (response.success) {
          const casesData = (response.data || []).map((caseItem: any) => ({
            _id: caseItem._id || caseItem.id,
            status: caseItem.status,
            currentStage: caseItem.currentStage,
            priority: caseItem.priority,
            createdAt: caseItem.createdAt,
            updatedAt: caseItem.updatedAt,
            lastActivity: caseItem.lastActivity,
            customer: caseItem.customer,
            vehicle: caseItem.vehicle,
            quote: caseItem.quote,
            transaction: caseItem.transaction,
            estimatedValue: caseItem.estimatedValue
          })) as CaseData[];
          setCases(casesData);
        } else {
          setError("Failed to fetch cases");
        }
      } catch (err) {
        setError("Error loading cases");
        console.error("Error fetching cases:", err);
      } finally {
        setLoading(false);
      }
    };

    setStageFilter('all')
    fetchCases();
  }, []);

  // Read status/stage from URL on mount
  useEffect(() => {
    const urlStatus = searchParams.get('status')
    const urlStage = searchParams.get('stage')
    if (urlStatus) setStatusFilter(mapStatusParamToDisplay(urlStatus))
    if (urlStage) setStageFilter(urlStage)
  }, [searchParams])

  // Fetch time tracking for all cases after fetching cases
  useEffect(() => {
    if (cases.length > 0) {
      Promise.all(
        cases.map(async (c) => {
          const res = await getTimeTrackingByCaseId(c._id);
          if (res.success && res.data) {
            // Sum all stageTimes' totalTime
            const stageTimes = res.data.stageTimes || {};
            let total = 0;
            Object.values(stageTimes).forEach((st: any) => {
              if (st && st.totalTime) total += st.totalTime;
            });
            return { id: c._id, total };
          }
          return { id: c._id, total: 0 };
        })
      ).then((arr) => {
        const obj: Record<string, number> = {};
        arr.forEach(({ id, total }) => { obj[id] = total; });
        setCaseTimes(obj);
      });
    }
  }, [cases]);
  
  // Add state for quick filter
  const [quickFilter, setQuickFilter] = useState<null | 'inProcess' | 'completedToday' | 'allCompleted' | 'allCases' | 'cancelled'>(null);

  const filteredCustomers = useMemo(() => {
    const filtered = cases.filter((caseData) => {
      const customer = caseData.customer;
      const vehicle = caseData.vehicle;
      const caseStatus = getStatusFromStage(caseData.currentStage, caseData.status);
      // Map status filter to display value for comparison
      const statusFilterDisplay = mapStatusParamToDisplay(statusFilter);
      const matchesSearch =
        `${customer?.firstName} ${customer?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.vin?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || 
        caseStatus === statusFilterDisplay ||
        (statusFilterDisplay === "Offer Declined / Closed" && (caseStatus === "Offer Declined / Closed"));
      const matchesStage = stageFilter === "all" || caseData.currentStage.toString() === stageFilter;

      // Quick filter logic
      let matchesQuick = true;
      if (quickFilter === 'inProcess') {
        matchesQuick = caseStatus !== 'Completed' && caseStatus !== 'Offer Declined / Closed';
      } else if (quickFilter === 'completedToday') {
        const today = new Date().toDateString();
        matchesQuick = caseStatus === 'Completed' && new Date(caseData.updatedAt || caseData.createdAt).toDateString() === today;
      } else if (quickFilter === 'allCompleted') {
        matchesQuick = caseStatus === 'Completed';
      } else if (quickFilter === 'allCases') {
        matchesQuick = true;
      } else if (quickFilter === 'cancelled') {
        matchesQuick = caseStatus === 'Offer Declined / Closed';
      }

      return matchesSearch && matchesStatus && matchesStage && matchesQuick;
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case "name":
          aValue = `${a.customer?.firstName || ''} ${a.customer?.lastName || ''}`.toLowerCase()
          bValue = `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.toLowerCase()
          break
        case "vehicle":
          aValue = `${a.vehicle?.year || ''} ${a.vehicle?.make || ''} ${a.vehicle?.model || ''}`.toLowerCase()
          bValue = `${b.vehicle?.year || ''} ${b.vehicle?.make || ''} ${b.vehicle?.model || ''}`.toLowerCase()
          break
        case "vin":
          aValue = (a.vehicle?.vin || '').toLowerCase()
          bValue = (b.vehicle?.vin || '').toLowerCase()
          break
        case "status":
          aValue = getStatusFromStage(a.currentStage, a.status).toLowerCase()
          bValue = getStatusFromStage(b.currentStage, b.status).toLowerCase()
          break
        case "value":
          aValue = getCaseAmount(a)
          bValue = getCaseAmount(b)
          break
        case "date":
          aValue = new Date(a.lastActivity?.timestamp || a.createdAt).getTime()
          bValue = new Date(b.lastActivity?.timestamp || b.createdAt).getTime()
          break
        default:
          aValue = `${a.customer?.firstName || ''} ${a.customer?.lastName || ''}`.toLowerCase()
          bValue = `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.toLowerCase()
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      } else {
        if (sortOrder === 'asc') {
          return (aValue as number) - (bValue as number)
        } else {
          return (bValue as number) - (aValue as number)
        }
      }
    })

    return filtered
  }, [searchTerm, statusFilter, stageFilter, cases, sortBy, sortOrder, quickFilter])
  
  // Calculate case stats - now based on filtered results
  const totalCases = filteredCustomers.length;
  
  const totalInProcess = filteredCustomers.filter(c => {
    const status = getStatusFromStage(c.currentStage, c.status);
    return status !== "Completed";
  }).length;
  
  const totalCompleted = filteredCustomers.filter(c => 
    getStatusFromStage(c.currentStage, c.status) === "Completed"
  ).length;

  // Today's completed - filter by today's date
  const today = new Date().toDateString()
  const completedToday = filteredCustomers.filter((c) => 
    getStatusFromStage(c.currentStage, c.status) === "Completed" && 
    new Date(c.updatedAt || c.createdAt).toDateString() === today
  ).length;

  // Total cancelled cases (includes both declined offers and closed cases)
  const totalCancelled = filteredCustomers.filter(c => 
    getStatusFromStage(c.currentStage, c.status) === "Offer Declined / Closed"
  ).length;

  const getStatusBadge = (currentStage: number, status: string) => {
    const caseStatus = getStatusFromStage(currentStage, status);
    return <Badge className={getStatusBadgeColor(caseStatus)}>{caseStatus}</Badge>
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-300"
    }
  }

  // Helper function to get the correct amount for a case
  const getCaseAmount = (caseData: CaseData) => {
    // For completed cases, use the final amount from quote or transaction
    if (caseData.quote?.offerDecision?.finalAmount) {
      return caseData.quote.offerDecision.finalAmount
    } else if (caseData.quote?.offerAmount) {
      return caseData.quote.offerAmount
    } else if (caseData.transaction?.billOfSale?.salePrice) {
      return caseData.transaction.billOfSale.salePrice
    } else {
      return caseData.estimatedValue || 0
    }
  }

  const handleLinkClick = (caseId: string) => {
    router.push(`/customer/${caseId}`)
  }
  
  const handleDeleteCase = async () => {
    if (!caseToDelete) return;
    try {
      const response = await api.deleteCase(caseToDelete);
      if (response.success) {
        setCases(prev => prev.filter(c => c._id !== caseToDelete));
        toast({
          title: "Case Deleted",
          description: "The case and all related data have been deleted successfully.",
        });
      } else {
        throw new Error(response.error || 'Failed to delete case');
      }
    } catch (error) {
      console.error('Error deleting case:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete case.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
    }
  };

  // Add formatDuration helper
  function formatDuration(ms: number) {
    if (!ms) return '0s';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    let str = '';
    if (h > 0) str += `${h}h `;
    if (m > 0 || h > 0) str += `${m}m `;
    str += `${s}s`;
    return str.trim();
  }

  const CustomerCard = ({ customer: caseData }: { customer: CaseData }) => (
    <div className="group relative">
        <Card
          className={cn(
            "cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4",
            getPriorityColor(caseData.priority),
          )}
          onClick={()=> handleLinkClick(caseData._id)}
        >
          {/* Action buttons */}
          <div className="absolute top-2 right-2 z-10 opacity-70 group-hover:opacity-100 flex gap-1">
            
            {/* Delete button for admin */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCaseToDelete(caseData._id);
                  setDeleteDialogOpen(true);
                }}
                title="Delete customer"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
          
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{`${caseData.customer?.firstName} ${caseData.customer?.lastName}`}</CardTitle>
                </div>
              </div>
              {getStatusBadge(caseData.currentStage, caseData.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {caseData.vehicle?.year} {caseData.vehicle?.make} {caseData.vehicle?.model}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <Badge className={stages[caseData.currentStage - 1]?.color}></Badge>
              <span className="text-sm text-muted-foreground">
                {caseData.lastActivity?.timestamp ? new Date(caseData.lastActivity.timestamp).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Est. Value</span>
              <span className="font-semibold text-green-600">
                ${getCaseAmount(caseData).toLocaleString()}
              </span>
            </div>
            <div className="case-time">
              <span>Time Spent: {caseTimes[caseData._id] ? formatDuration(caseTimes[caseData._id]) : 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Clear filter handler
  const handleClearFilter = () => {
    setStatusFilter('all')
    setStageFilter('all')
    setQuickFilter(null)
    // Remove query params from URL
    router.replace(pathname)
  }

  // Quick filter handlers
  const handleInProcessClick = () => {
    setQuickFilter('inProcess');
    setStatusFilter('all');
    setStageFilter('all');
  }
  const handleCompletedTodayClick = () => {
    setQuickFilter('completedToday');
    setStatusFilter('all');
    setStageFilter('all');
  }
  const handleTotalCasesClick = () => {
    setQuickFilter('allCases');
    setStatusFilter('all');
    setStageFilter('all');
  }
  const handleTotalCompletedClick = () => {
    setQuickFilter('allCompleted');
    setStatusFilter('all');
    setStageFilter('all');
  }

  const handleCancelledClick = () => {
    setQuickFilter('cancelled');
    setStatusFilter('all');
    setStageFilter('all');
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with stats and actions */}
      <div className="bg-white border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Assigned Cases</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage and track cases assigned to you</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Estimator Dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Clear filter button */}
            {(statusFilter !== 'all' || stageFilter !== 'all' || quickFilter !== null) && (
              <Button size="sm" variant="outline" onClick={handleClearFilter}>
                Clear
              </Button>
            )}
          </div>
          
          {/* Sorting Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="vin">VIN</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-600">Sort order:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-1 w-full sm:w-auto"
            >
              {sortOrder === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
            </Button>
          </div>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white border-b px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-4">
          {/* Desktop: search and status filter in a row; Mobile: stack */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers, vehicles, or VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex gap-3">
            <div className="w-full sm:w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="Pending Inspection">Pending Inspection</SelectItem>
                  <SelectItem value="Pending Quote">Pending Quote</SelectItem>
                  <SelectItem value="Pending Offer Decision">Pending Offer Decision</SelectItem>
                  <SelectItem value="Pending Paperwork">Pending Paperwork</SelectItem>
                  <SelectItem value="Pending Completion">Pending Completion</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Offer Declined / Closed">Offer Declined / Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center border rounded-lg ml-0 sm:ml-2">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <Card
            className={quickFilter === 'allCases' ? 'ring-2 ring-blue-400' : ''}
            onClick={handleTotalCasesClick}
            style={{ cursor: 'pointer' }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{totalCases}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Cases
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={quickFilter === 'inProcess' ? 'ring-2 ring-blue-400' : ''}
            onClick={handleInProcessClick}
            style={{ cursor: 'pointer' }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{totalInProcess}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">In Process</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={quickFilter === 'allCompleted' ? 'ring-2 ring-blue-400' : ''}
            onClick={handleTotalCompletedClick}
            style={{ cursor: 'pointer' }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{totalCompleted}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={quickFilter === 'completedToday' ? 'ring-2 ring-blue-400' : ''}
            onClick={handleCompletedTodayClick}
            style={{ cursor: 'pointer' }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{completedToday}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Completed Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={quickFilter === 'cancelled' ? 'ring-2 ring-blue-400' : ''}
            onClick={handleCancelledClick}
            style={{ cursor: 'pointer' }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{totalCancelled}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Closed Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer List/Cards */}
        {filteredCustomers.length > 0 ? (
          viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer._id} customer={customer} />
            ))}
          </div>
        ) : (
          <Card>
              <CardContent className="p-0">
                {/* List Headers */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 font-medium text-sm text-gray-600">
                  <div className="col-span-3 font-bold">Customer</div>
                  <div className="col-span-2 font-bold">Vehicle</div>
                  <div className="col-span-2 font-bold">VIN</div>
                  <div className="col-span-2 font-bold">Status</div>
                  <div className="col-span-1 font-bold">Est. Value</div>
                  <div className="col-span-1 font-bold">Last Activity</div>
                </div>
                
                {/* List Items */}
                <div className="space-y-1">
              {filteredCustomers.map((customer) => (
                <div
                  className={cn(
                          "md:grid md:grid-cols-12 md:gap-4 p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors border-l-4 relative",
                    getPriorityColor(customer.priority),
                  )}
                  onClick={()=> handleLinkClick(customer._id)}
                  key={customer._id}
                >
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{`${customer.customer?.firstName} ${customer.customer?.lastName}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.vehicle?.year} {customer.vehicle?.make} {customer.vehicle?.model}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusBadge(customer.currentStage, customer.status)}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCaseToDelete(customer._id);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete customer"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">VIN: {customer.vehicle?.vin || 'N/A'}</span>
                      <span className="font-semibold text-green-600">
                        ${getCaseAmount(customer).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last activity: {customer.lastActivity?.timestamp ? new Date(customer.lastActivity.timestamp).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  
                  {/* Desktop layout */}
                  <div className="hidden md:flex col-span-3 items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{`${customer.customer?.firstName} ${customer.customer?.lastName}`}</p>
                    </div>
                  </div>
                        <div className="hidden md:flex col-span-2 items-center">
                    <div>
                      <p className="font-medium">
                        {customer.vehicle?.year} {customer.vehicle?.make} {customer.vehicle?.model}
                      </p>
                      <p className="text-sm text-muted-foreground">{customer.vehicle?.mileage} miles</p>
                    </div>
                  </div>
                  <div className="hidden md:flex col-span-2 items-center">
                          <p className="text-sm font-mono">{customer.vehicle?.vin || 'N/A'}</p>
                        </div>
                        <div className="hidden md:flex col-span-2 items-center">
                          {getStatusBadge(customer.currentStage, customer.status)}
                  </div>
                        <div className="hidden md:flex col-span-1 items-center">
                    <span className="font-semibold text-green-600">
                      ${getCaseAmount(customer).toLocaleString()}
                    </span>
                  </div>
                        <div className="hidden md:flex col-span-1 items-center">
                    <span className="text-sm text-muted-foreground">
                      {customer.lastActivity?.timestamp ? new Date(customer.lastActivity.timestamp).toLocaleDateString() : 'N/A'}
                    </span>
                        </div>
                        {/* Delete button for admin in desktop list view */}
                        {isAdmin && (
                          <div className="hidden md:flex items-center col-span-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCaseToDelete(customer._id);
                                setDeleteDialogOpen(true);
                              }}
                              title="Delete customer"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                </div>
              ))}
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mb-4">
                  <Search className="h-12 w-12 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-lg font-medium mb-2">No cases found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "You don't have any assigned cases yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this case? This action cannot be undone and will remove all related data for this customer case.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCase}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 