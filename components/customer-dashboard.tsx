"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, LayoutGrid, List, Plus, Car, User, Clock, CheckCircle, Users, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { usePathname } from "next/navigation"

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
  const [cases, setCases] = useState<CaseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAdmin } = useAuth()
  const pathname = usePathname()

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

  const filteredCustomers = useMemo(() => {
    return cases.filter((caseData) => {
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
  }, [searchTerm, statusFilter, stageFilter, cases])
  
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

  const CustomerCard = ({ customer: caseData }: { customer: CaseData }) => (
    <Link href={`/customer/${caseData._id}`} className="block group relative">
      <Card
        className={cn(
          "cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4",
          getPriorityColor(caseData.priority),
        )}
      >
        {/* Delete button for admin */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 opacity-70 group-hover:opacity-100"
            onClick={e => { e.preventDefault(); e.stopPropagation(); handleDeleteCase(caseData._id) }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        )}
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
        </CardContent>
      </Card>
    </Link>
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
    <div className="bg-gray-50">
      {/* Controls */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Admin Dashboard button for admin only */}
            {isAdmin && pathname !== "/admin/customers" && (
              <Link href="/admin">
                <Button variant="outline" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Admin Dashboard
                </Button>
              </Link>
            )}
          </div>
          <Link href="/customer/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Customer
            </Button>
          </Link>
        </div>
      </div>
        <div className="bg-white border-b px-6 py-3">
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
        </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCases}</p>
                  <p className="text-sm text-muted-foreground">
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
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalInProcess}</p>
                  <p className="text-sm text-muted-foreground">In Process</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCompleted}</p>
                  <p className="text-sm text-muted-foreground">
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
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedToday}</p>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer List/Cards */}
        {filteredCustomers.length > 0 ? (
          viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer._id} customer={customer} />
            ))}
          </div>
        ) : (
          <Card>
              <CardContent className="p-0">
                {/* List Headers */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 font-medium text-sm text-gray-600">
                  <div className="col-span-3 font-bold">Customer</div>
                  <div className="col-span-2 font-bold">Vehicle</div>
                  <div className="col-span-2 font-bold">VIN</div>
                  <div className="col-span-2 font-bold">Status</div>
                  <div className="col-span-1 font-bold">Est. Value</div>
                  <div className="col-span-1 font-bold">Last Activity</div>
                  <div className="col-span-1 font-bold">Actions</div>
                </div>
                
                {/* List Items */}
                <div className="space-y-1">
              {filteredCustomers.map((customer) => (
                    <Link key={customer._id} href={`/customer/${customer._id}`} className="block">
                <div
                  className={cn(
                          "grid grid-cols-12 gap-4 p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors border-l-4 relative",
                    getPriorityColor(customer.priority),
                  )}
                >
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{`${customer.customer?.firstName} ${customer.customer?.lastName}`}</p>
                    </div>
                  </div>
                        <div className="col-span-2 flex items-center">
                    <div>
                      <p className="font-medium">
                        {customer.vehicle?.year} {customer.vehicle?.make} {customer.vehicle?.model}
                      </p>
                      <p className="text-sm text-muted-foreground">{customer.vehicle?.mileage} miles</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                          <p className="text-sm font-mono">{customer.vehicle?.vin || 'N/A'}</p>
                        </div>
                        <div className="col-span-2 flex items-center">
                          {getStatusBadge(customer.currentStage, customer.status)}
                  </div>
                        <div className="col-span-1 flex items-center">
                    <span className="font-semibold text-green-600">
                      ${getCaseAmount(customer).toLocaleString()}
                    </span>
                  </div>
                        <div className="col-span-1 flex items-center">
                    <span className="text-sm text-muted-foreground">
                      {customer.lastActivity?.timestamp ? new Date(customer.lastActivity.timestamp).toLocaleDateString() : 'N/A'}
                    </span>
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); handleDeleteCase(customer._id) }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
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
