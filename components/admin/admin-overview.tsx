"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
} from "lucide-react"
import api from "@/lib/api"

interface CaseData {
  _id: string
  status: string
  currentStage: number
  createdAt: string
  updatedAt?: string
  createdBy: string
  customer?: {
    firstName: string
    lastName: string
  }
  vehicle?: {
    year: string
    make: string
    model: string
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
}

interface RecentActivity {
  id: string
  customer: string
  vehicle: string
  status: string
  stage: number
  createdAt: string
  amount: number
}

interface TopPerformer {
  agentId: string
  cases: number
  revenue: number
}

interface DashboardStats {
  totalCases: number
  totalRevenue: number
  avgCaseValue: number
  completionRate: number
  avgProcessingTime: number
  casesByStatus: Record<string, number>
  casesByStage: Record<string, number>
  recentActivity: RecentActivity[]
  topPerformers: TopPerformer[]
}

export function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    totalRevenue: 0,
    avgCaseValue: 0,
    completionRate: 0,
    avgProcessingTime: 0,
    casesByStatus: {},
    casesByStage: {},
    recentActivity: [],
    topPerformers: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.getCases()
      
      if (response.success && response.data) {
        const cases = response.data as unknown as CaseData[]
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        
        // Filter cases based on time range
        const filteredCases = cases.filter((c: CaseData) => {
          const caseDate = new Date(c.createdAt)
          switch (timeRange) {
            case "7d":
              return caseDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            case "30d":
              return caseDate >= thirtyDaysAgo
            case "90d":
              return caseDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            default:
              return true
          }
        })

        // Calculate statistics
        const totalCases = filteredCases.length
        const completedCases = filteredCases.filter((c: CaseData) => c.status === "completed")
        const totalRevenue = completedCases.reduce((sum: number, c: CaseData) => {
          const amount = c.quote?.offerDecision?.finalAmount || c.quote?.offerAmount || c.transaction?.billOfSale?.salePrice || 0
          return sum + amount
        }, 0)
        
        const avgCaseValue = totalCases > 0 ? totalRevenue / totalCases : 0
        const completionRate = totalCases > 0 ? (completedCases.length / totalCases) * 100 : 0

        // Calculate average processing time
        const processingTimes = completedCases.map((c: CaseData) => {
          const created = new Date(c.createdAt)
          const completed = new Date(c.updatedAt || c.createdAt)
          return (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // days
        })
        const avgProcessingTime = processingTimes.length > 0 
          ? processingTimes.reduce((sum: number, time: number) => sum + time, 0) / processingTimes.length 
          : 0

        // Cases by status
        const casesByStatus = filteredCases.reduce((acc: Record<string, number>, c: CaseData) => {
          acc[c.status] = (acc[c.status] || 0) + 1
          return acc
        }, {})

        // Cases by stage
        const casesByStage = filteredCases.reduce((acc: Record<string, number>, c: CaseData) => {
          acc[`Stage ${c.currentStage}`] = (acc[`Stage ${c.currentStage}`] || 0) + 1
          return acc
        }, {})

        // Recent activity (last 10 cases)
        const recentActivity: RecentActivity[] = cases.slice(0, 10).map((c: CaseData) => ({
          id: c._id,
          customer: `${c.customer?.firstName || ''} ${c.customer?.lastName || ''}`.trim(),
          vehicle: `${c.vehicle?.year || ''} ${c.vehicle?.make || ''} ${c.vehicle?.model || ''}`.trim(),
          status: c.status,
          stage: c.currentStage,
          createdAt: c.createdAt,
          amount: c.quote?.offerDecision?.finalAmount || c.quote?.offerAmount || 0
        }))

        // Top performers (agents with most completed cases)
        const agentStats = completedCases.reduce((acc: Record<string, { cases: number; revenue: number }>, c: CaseData) => {
          const agentId = c.createdBy
          if (!acc[agentId]) {
            acc[agentId] = { cases: 0, revenue: 0 }
          }
          acc[agentId].cases += 1
          acc[agentId].revenue += c.quote?.offerDecision?.finalAmount || c.quote?.offerAmount || 0
          return acc
        }, {})

        const topPerformers: TopPerformer[] = Object.entries(agentStats)
          .map(([agentId, stats]) => ({ agentId, ...stats }))
          .sort((a, b) => b.cases - a.cases)
          .slice(0, 5)

        setStats({
          totalCases,
          totalRevenue,
          avgCaseValue,
          completionRate,
          avgProcessingTime,
          casesByStatus,
          casesByStage,
          recentActivity,
          topPerformers
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  const getStatusColor = (status: string) => {
    const colors = {
      new: "bg-yellow-100 text-yellow-800",
      active: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Overview</h2>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "all"].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === "all" ? "All Time" : range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From completed cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Case Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgCaseValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average per case
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Cases completed successfully
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Cases by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.casesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cases by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Cases by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.casesByStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stage}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Car className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{activity.customer}</p>
                    <p className="text-sm text-muted-foreground">{activity.vehicle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Stage {activity.stage}
                  </span>
                  <span className="font-semibold text-green-600">
                    ${activity.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 