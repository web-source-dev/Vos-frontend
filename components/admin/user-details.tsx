"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft,
  User, 
  Crown, 
  Calculator,
  Search,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Car,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  BarChart3,
  Activity,
  Target,
  Award,
  Zap,
  Eye,
  CalendarDays,
  Timer,
  DollarSign as DollarSignIcon,
  Car as CarIcon,
  Users as UsersIcon,
  FileText as FileTextIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  Calendar as CalendarIcon,
  BarChart3 as BarChart3Icon,
  Activity as ActivityIcon,
  Target as TargetIcon,
  Award as AwardIcon,
  Zap as ZapIcon,
  Eye as EyeIcon,
  CalendarDays as CalendarDaysIcon,
  Timer as TimerIcon,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface UserDetailsProps {
  userId: string
}

interface UserAnalytics {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    location?: string
    createdAt: string
  }
  overview: {
    totalCases: number
    completedCases: number
    activeCases: number
    totalRevenue: number
    averageCaseValue: number
    completionRate: number
    averageProcessingTime: number
  }
  timeTracking: {
    totalTimeSpent: number
    averageTimePerCase: number
    timeByStage: Record<string, number>
    recentActivity: Array<{
      caseId: string
      status: string
      lastActivity?: { description: string; timestamp: string }
      updatedAt: string
      customer?: { name: string; id: string }
      vehicle?: { year: string; make: string; model: string; id: string }
    }>
  }
  performance: {
    casesThisMonth: number
    casesLastMonth: number
    revenueThisMonth: number
    revenueLastMonth: number
    topPerformingMonths: Array<{ month: string; cases: number; revenue: number }>
  }
  vehicles: {
    totalVehicles: number
    lowestValue: number | null
    highestValue: number | null
    averageValue: number
    valueDistribution: Record<string, number>
  }
  roleSpecific: any
}

export function UserDetails({ userId }: UserDetailsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  const fetchUserAnalytics = async () => {
    setLoading(true)
    try {
      const response = await api.getUserAnalytics(userId, timeRange)
      if (response.success && response.data) {
        setAnalytics(response.data)
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch user analytics",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching user analytics:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user analytics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserAnalytics()
  }, [userId, timeRange])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-5 w-5" />
      case 'agent': return <User className="h-5 w-5" />
      case 'estimator': return <Calculator className="h-5 w-5" />
      case 'inspector': return <Search className="h-5 w-5" />
      default: return <User className="h-5 w-5" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'agent': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'estimator': return 'bg-green-100 text-green-800 border-green-200'
      case 'inspector': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatTime = (milliseconds: number) => {
    if (!milliseconds || isNaN(milliseconds)) return '0m 0s'
    
    // Convert milliseconds to seconds
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m ${seconds}s`
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">No user data found</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">

<Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {analytics.user.firstName} {analytics.user.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${getRoleColor(analytics.user.role)} flex items-center gap-1`}>
                {getRoleIcon(analytics.user.role)}
                <span className="capitalize">{analytics.user.role}</span>
              </Badge>
              {analytics.user.location && (
                <span className="text-gray-600">• {analytics.user.location}</span>
              )}
            </div>
          </div>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-600">Total Cases</p>
                <p className="text-3xl font-bold text-blue-900">{analytics.overview.totalCases}</p>
                <p className="text-xs text-blue-500">
                  {analytics.overview.completedCases} completed
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900">
                  {formatCurrency(analytics.overview.totalRevenue)}
                </p>
                <p className="text-xs text-green-500">
                  Avg: {formatCurrency(analytics.overview.averageCaseValue)}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-600">Completion Rate</p>
                <p className="text-3xl font-bold text-purple-900">
                  {analytics.overview.completionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-purple-500">
                  {analytics.overview.activeCases} active cases
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-600">Avg Processing Time</p>
                <p className="text-3xl font-bold text-orange-900">
                  {formatTime(analytics.timeTracking.averageTimePerCase || 0)}
                </p>
                <p className="text-xs text-orange-500">
                  over {analytics.overview.totalCases} cases
                </p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-gray-600" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-600">This Month</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.performance.casesThisMonth}</p>
                <p className="text-xs text-blue-500">cases</p>
                <p className="text-sm font-semibold text-blue-700">
                  {formatCurrency(analytics.performance.revenueThisMonth)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-600">Last Month</p>
                <p className="text-2xl font-bold text-green-900">{analytics.performance.casesLastMonth}</p>
                <p className="text-xs text-green-500">cases</p>
                <p className="text-sm font-semibold text-green-700">
                  {formatCurrency(analytics.performance.revenueLastMonth)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">Change:</span>
              <div className="flex items-center gap-1">
                {analytics.performance.casesThisMonth > analytics.performance.casesLastMonth ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={analytics.performance.casesThisMonth > analytics.performance.casesLastMonth ? "text-green-600" : "text-red-600"}>
                  {Math.abs(analytics.performance.casesThisMonth - analytics.performance.casesLastMonth)} cases
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-gray-600" />
              Vehicle Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Vehicles:</span>
                <span className="font-semibold">{analytics.vehicles.totalVehicles}</span>
              </div>
              {analytics.vehicles.highestValue && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Highest Value:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(analytics.vehicles.highestValue)}
                  </span>
                </div>
              )}
              {analytics.vehicles.lowestValue && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lowest Value:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(analytics.vehicles.lowestValue)}
                  </span>
                </div>
              )}
              {analytics.vehicles.averageValue > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Value:</span>
                  <span className="font-semibold">
                    {formatCurrency(analytics.vehicles.averageValue)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-Specific Analytics */}
      {analytics.user.role === 'agent' && analytics.roleSpecific && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Agent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{analytics.roleSpecific.customersCreated}</p>
                <p className="text-sm text-gray-600">Customers Created</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.roleSpecific.averageCustomerValue)}
                </p>
                <p className="text-sm text-gray-600">Average Customer Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.roleSpecific.conversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Conversion Rate</p>
              </div>
            </div>
            {analytics.roleSpecific.topCustomers && analytics.roleSpecific.topCustomers.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Top Customers</h4>
                <div className="space-y-2">
                  {analytics.roleSpecific.topCustomers.map((customer: any, index: number) => (
                    <div key={customer.customerId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{customer.customerName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={customer.status === 'completed' ? 'default' : 'secondary'}>
                          {customer.status}
                        </Badge>
                        <span className="font-semibold">{formatCurrency(customer.caseValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {analytics.user.role === 'estimator' && analytics.roleSpecific && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              Estimator Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{analytics.roleSpecific.customersCreated}</p>
                <p className="text-sm text-gray-600">Customers Created</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics.roleSpecific.averageCustomerValue)}
                </p>
                <p className="text-sm text-gray-600">Average Customer Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.roleSpecific.conversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Conversion Rate</p>
              </div>
            </div>
            {analytics.roleSpecific.topCustomers && analytics.roleSpecific.topCustomers.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Top Customers</h4>
                <div className="space-y-2">
                  {analytics.roleSpecific.topCustomers.map((customer: any, index: number) => (
                    <div key={customer.customerId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{customer.customerName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={customer.status === 'completed' ? 'default' : 'secondary'}>
                          {customer.status}
                        </Badge>
                        <span className="font-semibold">{formatCurrency(customer.caseValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {analytics.user.role === 'inspector' && analytics.roleSpecific && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-600" />
              Inspector Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{analytics.roleSpecific.inspectionsCompleted}</p>
                <p className="text-sm text-gray-600">Inspections Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {analytics.roleSpecific.averageInspectionScore.toFixed(1)}/100
                </p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatTime(analytics.roleSpecific.averageInspectionTime)}
                </p>
                <p className="text-sm text-gray-600">Average Time</p>
              </div>
            </div>
            {analytics.roleSpecific.recentInspections && analytics.roleSpecific.recentInspections.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Recent Inspections</h4>
                <div className="space-y-2">
                  {analytics.roleSpecific.recentInspections.map((inspection: any, index: number) => (
                    <div key={inspection.caseId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={inspection.status === 'completed' ? 'default' : 'secondary'}>
                          {inspection.status}
                        </Badge>
                        <span className="font-semibold">{inspection.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Time Tracking */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-gray-600" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Time Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Time Spent:</span>
                  <span className="font-semibold">{formatTime(analytics.timeTracking.totalTimeSpent)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Time per Case:</span>
                  <span className="font-semibold">{formatTime(analytics.timeTracking.averageTimePerCase)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Time by Stage</h4>
              <div className="space-y-2">
                {Object.entries(analytics.timeTracking.timeByStage).length > 0 ? (
                  Object.entries(analytics.timeTracking.timeByStage).map(([stage, time]) => (
                    <div key={stage} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{stage.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-semibold">{formatTime(time)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No time tracking data available</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.timeTracking.recentActivity.length > 0 ? (
              analytics.timeTracking.recentActivity.map((activity) => (
                <div key={activity.caseId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">
                        {activity.customer ? activity.customer.name : `Case #${activity.caseId.slice(-6)}`}
                      </p>
                    </div>
                    {activity.vehicle && (
                      <p className="text-sm text-gray-600">
                        {activity.vehicle.year} {activity.vehicle.make} {activity.vehicle.model}
                      </p>
                    )}
                    {activity.lastActivity && activity.lastActivity.description && (
                      <p className="text-xs text-gray-500 mt-1">{activity.lastActivity.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                    <span className="text-sm text-gray-500">{formatDate(activity.updatedAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 