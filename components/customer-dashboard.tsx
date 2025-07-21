"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, LayoutGrid, List, Plus, Car, User, Clock, CheckCircle, Users, Trash2, Mail, Send, Copy, Check, ArrowUp, ArrowDown, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
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
  { id: 1, name: "Intake", color: "bg-blue-100 text-blue-800" },
  { id: 2, name: "Schedule", color: "bg-purple-100 text-purple-800" },
  { id: 3, name: "Inspection", color: "bg-orange-100 text-orange-800" },
  { id: 4, name: "Quote", color: "bg-yellow-100 text-yellow-800" },
  { id: 5, name: "Decision", color: "bg-pink-100 text-pink-800" },
  { id: 6, name: "Paperwork", color: "bg-indigo-100 text-indigo-800" },
  { id: 7, name: "Complete", color: "bg-green-100 text-green-800" },
]

// New status mapping based on current stage
const getStatusFromStage = (currentStage: number, status: string) => {
  if (status === "completed") return "Completed"
  
  switch (currentStage) {
    case 1:
    case 2:
      return "Pending Inspection Scheduling"
    case 3:
      return "Pending Inspection Completion"
    case 4:
      return "Pending Quote"
    case 5:
      return "Pending Offer Decision"
    case 6:
      return "Pending Paperwork"
    case 7:
      return "Pending Completion"
    default:
      return "Pending Inspection Scheduling"
  }
}

const getStatusBadgeColor = (status: string) => {
  const statusConfig = {
    "Pending Inspection Scheduling": "bg-yellow-100 text-yellow-800",
    "Pending Inspection Completion": "bg-orange-100 text-orange-800",
    "Pending Quote": "bg-blue-100 text-blue-800",
    "Pending Offer Decision": "bg-purple-100 text-purple-800",
    "Pending Paperwork": "bg-indigo-100 text-indigo-800",
    "Pending Completion": "bg-pink-100 text-pink-800",
    "Completed": "bg-green-100 text-green-800",
  }
  return statusConfig[status as keyof typeof statusConfig] || "bg-gray-100 text-gray-800"
}

export function CustomerDashboard() {
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [cases, setCases] = useState<CaseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [formUrl, setFormUrl] = useState("")
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { isAdmin } = useAuth()
  const pathname = usePathname()
  const { toast } = useToast()
  // Add state to store time tracking data
  const [caseTimes, setCaseTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await api.getCases();
        if (response.success) {
          setCases(response.data as unknown as CaseData[] || []);
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
  
  const filteredCustomers = useMemo(() => {
    const filtered = cases.filter((caseData) => {
      const customer = caseData.customer;
      const vehicle = caseData.vehicle;
      const caseStatus = getStatusFromStage(caseData.currentStage, caseData.status);
      
      const matchesSearch =
        `${customer?.firstName} ${customer?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.vin?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || caseStatus === statusFilter
      const matchesStage = stageFilter === "all" || caseData.currentStage.toString() === stageFilter

      return matchesSearch && matchesStatus && matchesStage
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
  }, [searchTerm, statusFilter, stageFilter, cases, sortBy, sortOrder])
  
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

  const getProgressPercentage = (currentStage: number) => {
    return Math.round(((currentStage - 1) / 7) * 100)
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
  
  // Placeholder delete handler
  const handleDeleteCase = (caseId: string) => {
    // TODO: Implement actual delete logic
    if (window.confirm("Are you sure you want to delete this case? This action cannot be undone.")) {
      // Call API to delete case
      alert(`Delete case ${caseId} (not implemented)`)
    }
  }

  const handleSendCustomerForm = async () => {
    if (!customerEmail || !customerName) {
      toast({
        title: "Missing Information",
        description: "Please enter both customer email and name.",
        variant: "destructive",
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await api.sendCustomerIntakeEmail(customerEmail, customerName)
      
      if (response.success) {
        toast({
          title: "Email Sent Successfully",
          description: `Customer form email has been sent to ${customerEmail}`,
        })
        setIsEmailModalOpen(false)
        setCustomerEmail("")
        setCustomerName("")
        setFormUrl("")
        setIsLinkCopied(false)
      } else {
        throw new Error(response.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Error sending customer form email:', error)
      toast({
        title: "Email Send Failed",
        description: "There was an error sending the customer form email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/customer-intake`
    try {
      await navigator.clipboard.writeText(url)
      setIsLinkCopied(true)
      toast({
        title: "Link Copied",
        description: "Form link has been copied to clipboard",
      })
      setTimeout(() => setIsLinkCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleOpenModal = () => {
    setFormUrl(`${window.location.origin}/customer-intake`)
    setIsEmailModalOpen(true)
    setCustomerEmail("")
    setCustomerName("")
    setIsLinkCopied(false)
  }

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
      <Link href={`/customer/${caseData._id}`} className="block">
        <Card
          className={cn(
            "cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4",
            getPriorityColor(caseData.priority),
          )}
        >
          {/* Action buttons */}
          <div className="absolute top-2 right-2 z-10 opacity-70 group-hover:opacity-100 flex gap-1">
            
            {/* Delete button for admin */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={e => { e.preventDefault(); e.stopPropagation(); handleDeleteCase(caseData._id) }}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{getProgressPercentage(caseData.currentStage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, getProgressPercentage(caseData.currentStage))}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge className={stages[caseData.currentStage - 1]?.color}>
                {stages[caseData.currentStage - 1]?.name}
              </Badge>
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
      </Link>
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

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with stats and actions */}
      <div className="bg-white border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your customer cases and track progress</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Send Customer Form Button */}
            <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto" onClick={handleOpenModal}>
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Send Customer Form</span>
                  <span className="sm:hidden">Send Form</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Send Customer Intake Form</DialogTitle>
                  <DialogDescription>
                    Send the customer intake form to a customer via email. They will receive a link to complete the form online.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Form Link Section */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <Label className="text-sm font-medium">Form Link</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      {isLinkCopied ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-white p-2 rounded border text-sm font-mono break-all">
                    {formUrl}
                  </div>
                </div>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer's full name"
                      className="col-span-4"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="col-span-4"
                    />
                  </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEmailModalOpen(false)}
                    disabled={isSendingEmail}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendCustomerForm}
                    disabled={isSendingEmail || !customerEmail || !customerName}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    {isSendingEmail ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Form
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* New Customer Button */}
            <Link href="/customer/new" className="w-full sm:w-auto">
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Customer</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Admin Dashboard button for admin only */}
            {isAdmin && pathname !== "/admin/customers" && (
              <Link href="/admin" className="w-full sm:w-auto">
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                  <span className="sm:hidden">Admin</span>
                </Button>
              </Link>
            )}
            
            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden flex items-center gap-2"
            >
              <Menu className="h-4 w-4" />
              Filters
            </Button>
          </div>
          
          {/* Sorting Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
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
      
      {/* Search and Filters */}
      <div className="bg-white border-b px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers, vehicles, or VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center border rounded-lg">
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
          
          {/* Mobile filters */}
          {showMobileFilters && (
            <div className="flex flex-col gap-3 sm:hidden">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="Pending Inspection Scheduling">Pending Inspection Scheduling</SelectItem>
                  <SelectItem value="Pending Inspection Completion">Pending Inspection Completion</SelectItem>
                  <SelectItem value="Pending Quote">Pending Quote</SelectItem>
                  <SelectItem value="Pending Offer Decision">Pending Offer Decision</SelectItem>
                  <SelectItem value="Pending Paperwork">Pending Paperwork</SelectItem>
                  <SelectItem value="Pending Completion">Pending Completion</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Desktop filters */}
          <div className="hidden sm:flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="Pending Inspection Scheduling">Pending Inspection Scheduling</SelectItem>
                <SelectItem value="Pending Inspection Completion">Pending Inspection Completion</SelectItem>
                <SelectItem value="Pending Quote">Pending Quote</SelectItem>
                <SelectItem value="Pending Offer Decision">Pending Offer Decision</SelectItem>
                <SelectItem value="Pending Paperwork">Pending Paperwork</SelectItem>
                <SelectItem value="Pending Completion">Pending Completion</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{totalCases}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || stageFilter !== "all" 
                      ? "Filtered Cases" 
                      : "Total Cases"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
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

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{totalCompleted}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || stageFilter !== "all" 
                      ? "Filtered Completed" 
                      : "Total Completed"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
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
                    <Link key={customer._id} href={`/customer/${customer._id}`} className="block">
                <div
                  className={cn(
                          "md:grid md:grid-cols-12 md:gap-4 p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors border-l-4 relative",
                    getPriorityColor(customer.priority),
                  )}
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
                      {getStatusBadge(customer.currentStage, customer.status)}
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
                </div>
                    </Link>
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
                <h3 className="text-lg font-medium mb-2">No customers found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "There are no customers in the system yet."}
                </p>
                <Link href="/customer/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Customer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
