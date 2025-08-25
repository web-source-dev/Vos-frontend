"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Car, DollarSign, Calendar, CheckCircle, Clock, XCircle, Eye, Settings } from "lucide-react"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface CustomerData {
  _id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  stats: {
    totalCases: number
    completedCases: number
    totalValue: number
    lastActivity?: {
      timestamp: string
      caseId: string
      status: string
    }
  }
}

interface CaseData {
  _id: string
  status: string
  currentStage: number
  createdAt: string
  updatedAt?: string
  lastActivity?: {
    timestamp: string
  }
  customer?: {
    firstName: string
    lastName: string
    cellPhone: string
    source?: string
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

export default function PerCustomerCases() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [cases, setCases] = useState<CaseData[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const customerId = params.id as string

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (customerId) {
      fetchCustomerData()
    }
  }, [customerId, isAuthenticated, loading])

  const fetchCustomerData = async () => {
    try {
      setLoadingData(true)

      // First, get the customer data from the customers list
      const customersResponse = await api.getCustomers()
      if (customersResponse.success) {
        const customerData = customersResponse.data?.find((c: CustomerData) => c._id === customerId)
        if (customerData) {
          setCustomer(customerData)
        } else {
          setError("Customer not found")
          return
        }
      } else {
        setError("Failed to fetch customer data")
        return
      }

      // Then, get all cases for this customer
      const casesResponse = await api.getCasesByCustomerId(customerId)
      if (casesResponse.success) {
        setCases(casesResponse.data as unknown as CaseData[])
      } else {
        setError("Failed to fetch customer cases")
      }
    } catch (err) {
      console.error("Error fetching customer data:", err)
      setError("Error loading customer data")
    } finally {
      setLoadingData(false)
    }
  }

  const getStatusFromStage = (currentStage: number, status: string) => {
    if (status === "completed") return "Completed"
    if (status === "quote-declined") return "Closed"
    if (status === "cancelled") return "Closed"

    switch (currentStage) {
      case 1:
        return "Pending Customer Intake"
      case 2:
        return "Pending Inspection"
      case 3:
        return "Pending Inspection"
      case 4:
        return "Pending Quote & Offer Decision"
      case 5:
        return "Pending Paperwork"
      case 6:
        return "Completed"
      default:
        return "Pending Inspection Scheduling"
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

  const getCaseAmount = (caseData: CaseData) => {
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

  const handleCaseClick = (caseId: string) => {
    router.push(`/customer/${caseId}`)
  }

  const handleStatusUpdate = async (caseId: string, newStatus: string) => {
    try {
      setUpdatingStatus(caseId)

      const response = await api.updateCaseStatus(caseId, newStatus)

      if (response.success) {
        // Update the case in the local state
        setCases(prevCases =>
          prevCases.map(case_ =>
            case_._id === caseId
              ? { ...case_, status: newStatus }
              : case_
          )
        )

        toast({
          title: "Status Updated",
          description: `Case status has been updated to ${newStatus}`,
        })

        // Refresh customer data to update stats
        fetchCustomerData()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating case status:", error)
      toast({
        title: "Error",
        description: "Failed to update case status",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customer data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Customer not found</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-gray-600">{customer.email}</p>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-blue-600">{customer.stats.totalCases}</p>
              </div>
              <Car className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Cases</p>
                <p className="text-2xl font-bold text-green-600">{customer.stats.completedCases}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${customer.stats.totalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Member Since</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Cases ({cases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cases.length > 0 ? (
            <div className="space-y-4">
              {cases.map((caseData) => (
                <Card key={caseData._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center space-x-4 cursor-pointer flex-1"
                        onClick={() => handleCaseClick(caseData._id)}
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {caseData.vehicle?.year} {caseData.vehicle?.make} {caseData.vehicle?.model}
                          </h3>
                          <p className="text-sm text-gray-600">
                            VIN: {caseData.vehicle?.vin || 'N/A'} • {caseData.vehicle?.mileage || 'N/A'} miles
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ${getCaseAmount(caseData).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(caseData.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusBadgeColor(getStatusFromStage(caseData.currentStage, caseData.status))}>
                          {getStatusFromStage(caseData.currentStage, caseData.status)}
                        </Badge>

                        {/* Status Update Dropdown */}
                        <div className="flex items-center space-x-2">
                          {caseData.status !== "cancelled" && caseData.status !== "completed" && (
                            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(caseData._id, "cancelled")}>
                              <XCircle className="h-4 w-4" />
                              Cancelled/Closed
                            </Button>

                          )}
                          {caseData.status !== "cancelled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCaseClick(caseData._id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
              <p className="text-gray-600">
                This customer hasn't submitted any vehicles yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
