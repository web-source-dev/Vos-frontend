"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft,
  Search, 
  Clock,
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
  FileText,
  TrendingUp,
  TrendingDown,
  Car,
  Users,
  DollarSign,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface InspectorDetailsProps {
  userId: string
}

interface InspectorAnalytics {
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
    totalInspections: number
    completedInspections: number
    pendingInspections: number
    inProgressInspections: number
    averageInspectionTime: number
    averageInspectionScore: number
    completionRate: number
  }
  timeTracking: {
    totalTimeSpent: number
    averageTimePerInspection: number
    timeByInspection: Record<string, number>
    recentActivity: Array<{
      inspectionId: string
      caseId: string
      status: string
      score?: number
      timeSpent?: number
      completedAt?: string
      customer?: { name: string; id: string }
      vehicle?: { year: string; make: string; model: string; id: string }
    }>
  }
  performance: {
    inspectionsThisMonth: number
    inspectionsLastMonth: number
    completedThisMonth: number
    completedLastMonth: number
    averageScoreThisMonth: number
    averageScoreLastMonth: number
  }
  vehicles: {
    totalVehicles: number
    vehicleTypes: Record<string, number>
    averageVehicleValue: number
  }
  roleSpecific: {
    inspectionsCompleted: number
    averageInspectionScore: number
    averageInspectionTime: number
    recentInspections: Array<{
      caseId: string
      score: number
      status: string
      completedAt: string
      timeSpent: number
      customerName: string
      vehicleInfo: string
    }>
    pendingInspections: Array<{
      caseId: string
      scheduledDate: string
      customerName: string
      vehicleInfo: string
    }>
    inProgressInspections: Array<{
      caseId: string
      startedAt: string
      customerName: string
      vehicleInfo: string
    }>
  }
}

export function InspectorDetails({ userId }: InspectorDetailsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<InspectorAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  const fetchInspectorAnalytics = async () => {
    setLoading(true)
    try {
      const response = await api.getUserAnalytics(userId, timeRange)
      if (response.success && response.data) {
        setAnalytics(response.data)
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch inspector analytics",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching inspector analytics:", error)
      toast({
        title: "Error",
        description: "Failed to fetch inspector analytics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInspectorAnalytics()
  }, [userId, timeRange])

  const formatTime = (milliseconds: number) => {
    if (!milliseconds || isNaN(milliseconds)) return '0m 0s'
    
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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
        <p className="text-lg font-medium text-gray-500">No inspector data found</p>
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
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
                <Search className="h-4 w-4" />
                <span className="capitalize">Inspector</span>
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-600">Total Inspections</p>
                <p className="text-3xl font-bold text-purple-900">{analytics.overview.totalInspections || 0}</p>
                <p className="text-xs text-purple-500">
                  {analytics.overview.completedInspections || 0} completed
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <Search className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">Completion Rate</p>
                <p className="text-3xl font-bold text-green-900">
                  {(analytics.overview.completionRate || 0).toFixed(1)}%
                </p>
                <p className="text-xs text-green-500">
                  {analytics.overview.pendingInspections || 0} pending
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-600">Average Score</p>
                <p className="text-3xl font-bold text-blue-900">
                  {(analytics.overview.averageInspectionScore || 0).toFixed(1)}/100
                </p>
                <p className="text-xs text-blue-500">
                  Quality rating
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-600">Avg Time</p>
                <p className="text-3xl font-bold text-orange-900">
                  {formatTime(analytics.overview.averageInspectionTime || 0)}
                </p>
                <p className="text-xs text-orange-500">
                  Per inspection
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
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-600">This Month</p>
                <p className="text-2xl font-bold text-purple-900">{analytics.performance.inspectionsThisMonth}</p>
                <p className="text-xs text-purple-500">inspections</p>
                <p className="text-sm font-semibold text-purple-700">
                  {analytics.performance.completedThisMonth} completed
                </p>
                <p className="text-xs text-purple-500">
                  {analytics.performance.averageScoreThisMonth.toFixed(1)}/100 avg score
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-600">Last Month</p>
                <p className="text-2xl font-bold text-green-900">{analytics.performance.inspectionsLastMonth}</p>
                <p className="text-xs text-green-500">inspections</p>
                <p className="text-sm font-semibold text-green-700">
                  {analytics.performance.completedLastMonth} completed
                </p>
                <p className="text-xs text-green-500">
                  {analytics.performance.averageScoreLastMonth.toFixed(1)}/100 avg score
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">Change:</span>
              <div className="flex items-center gap-1">
                {analytics.performance.inspectionsThisMonth > analytics.performance.inspectionsLastMonth ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={analytics.performance.inspectionsThisMonth > analytics.performance.inspectionsLastMonth ? "text-green-600" : "text-red-600"}>
                  {Math.abs(analytics.performance.inspectionsThisMonth - analytics.performance.inspectionsLastMonth)} inspections
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
                <span className="text-sm text-gray-600 font-bold">Total Vehicles:</span>
                <span className="font-semibold">{analytics.vehicles.totalVehicles}</span>
              </div>
              {Object.entries(analytics.vehicles.vehicleTypes).length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-2">Vehicle Types:</p>
                  <div className="space-y-1">
                    {Object.entries(analytics.vehicles.vehicleTypes).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 capitalize">{type}:</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inspection Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Completed ({analytics.roleSpecific.recentInspections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.roleSpecific.recentInspections.length > 0 ? (
                analytics.roleSpecific.recentInspections.slice(0, 5).map((inspection) => (
                  <div key={inspection.caseId} className="p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{inspection.customerName}</span>
                      <Badge variant="default" className="text-xs">
                        {inspection.score}/100
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{inspection.vehicleInfo}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{formatTime(inspection.timeSpent)}</span>
                      <span>{formatDate(inspection.completedAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No completed inspections</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              In Progress ({analytics.roleSpecific.inProgressInspections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.roleSpecific.inProgressInspections.length > 0 ? (
                analytics.roleSpecific.inProgressInspections.slice(0, 5).map((inspection) => (
                  <div key={inspection.caseId} className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{inspection.customerName}</span>
                      <Badge variant="secondary" className="text-xs">
                        In Progress
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{inspection.vehicleInfo}</p>
                    <div className="text-xs text-gray-500">
                      Started: {formatDate(inspection.startedAt)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No inspections in progress</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Calendar className="h-5 w-5" />
              Pending ({analytics.roleSpecific.pendingInspections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.roleSpecific.pendingInspections.length > 0 ? (
                analytics.roleSpecific.pendingInspections.slice(0, 5).map((inspection) => (
                  <div key={inspection.caseId} className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{inspection.customerName}</span>
                      <Badge variant="outline" className="text-xs">
                        Scheduled
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{inspection.vehicleInfo}</p>
                    <div className="text-xs text-gray-500">
                      Scheduled: {formatDate(inspection.scheduledDate)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No pending inspections</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <span className="text-sm text-gray-600">Average Time per Inspection:</span>
                  <span className="font-semibold">{formatTime(analytics.timeTracking.averageTimePerInspection)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {analytics.timeTracking.recentActivity.length > 0 ? (
                  analytics.timeTracking.recentActivity.map((activity) => (
                    <div key={activity.inspectionId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {activity.customer ? activity.customer.name : `Inspection #${activity.inspectionId.slice(-6)}`}
                          </p>
                          <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {activity.status}
                          </Badge>
                        </div>
                        {activity.vehicle && (
                          <p className="text-xs text-gray-600">
                            {activity.vehicle.year} {activity.vehicle.make} {activity.vehicle.model}
                          </p>
                        )}
                        {activity.score && (
                          <p className="text-xs text-gray-500">Score: {activity.score}/100</p>
                        )}
                      </div>
                      <div className="text-right">
                        {activity.timeSpent && (
                          <p className="text-xs text-gray-500">{formatTime(activity.timeSpent)}</p>
                        )}
                        {activity.completedAt && (
                          <p className="text-xs text-gray-500">{formatDate(activity.completedAt)}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 