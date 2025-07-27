"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users,
  DollarSign, 
  TrendingUp,
  CheckCircle,
  BarChart3,
  Activity,
  Calendar,
  Download,
  Clock,
  Target,
  Award,
  Car
} from "lucide-react"
import {
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import { getEstimatorAnalytics } from "@/lib/api"
import { useAuth } from "@/lib/auth"

interface EstimatorAnalytics {
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
  roleSpecific: {
    customersCreated: number
    averageCustomerValue: number
    conversionRate: number
    totalQuotes: number
    acceptedQuotes: number
    declinedQuotes: number
    negotiatingQuotes: number
    pendingQuotes: number
    totalQuoteValue: number
    acceptedQuoteValue: number
    averageQuoteAmount: number
    quoteAcceptanceRate: number
    topCustomers: Array<{
      customerId: string
      customerName: string
      caseValue: number
      status: string
      quoteAmount: number
      quoteStatus: string
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function EstimatorReports() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<EstimatorAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [reportType, setReportType] = useState("overview")

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getEstimatorAnalytics(timeRange)
      
      if (response.success && response.data) {
        setAnalytics(response.data)
      } else {
        console.error("Failed to fetch analytics:", response.error)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const exportPDF = () => {
    if (!analytics) return

    // Create a simple HTML report for PDF generation
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Estimator Report - ${user?.firstName} ${user?.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metric { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .metric h3 { margin: 0 0 10px 0; color: #333; }
            .metric p { margin: 5px 0; }
            .highlight { font-size: 24px; font-weight: bold; color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Estimator Performance Report</h1>
            <p><strong>Estimator:</strong> ${user?.firstName} ${user?.lastName}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} for ${timeRange}</p>
          </div>
          
          <div class="metric">
            <h3>Key Metrics</h3>
            <p><strong>Total Cases:</strong> <span class="highlight">${analytics.overview.totalCases}</span></p>
            <p><strong>Completed Cases:</strong> <span class="highlight">${analytics.overview.completedCases}</span></p>
            <p><strong>Total Revenue Generated:</strong> <span class="highlight">$${analytics.overview.totalRevenue.toLocaleString()}</span></p>
            <p><strong>Average Case Value:</strong> <span class="highlight">$${analytics.overview.averageCaseValue.toLocaleString()}</span></p>
            <p><strong>Completion Rate:</strong> <span class="highlight">${analytics.overview.completionRate.toFixed(1)}%</span></p>
            <p><strong>Average Processing Time:</strong> <span class="highlight">${analytics.overview.averageProcessingTime.toFixed(1)} days</span></p>
          </div>
          
          <div class="metric">
            <h3>Monthly Performance</h3>
            <p><strong>Cases This Month:</strong> ${analytics.performance.casesThisMonth}</p>
            <p><strong>Cases Last Month:</strong> ${analytics.performance.casesLastMonth}</p>
            <p><strong>Revenue This Month:</strong> $${analytics.performance.revenueThisMonth.toLocaleString()}</p>
            <p><strong>Revenue Last Month:</strong> $${analytics.performance.revenueLastMonth.toLocaleString()}</p>
          </div>
          
          <div class="metric">
            <h3>Top Customers</h3>
            <table>
              <tr><th>Customer</th><th>Case Value</th><th>Status</th></tr>
              ${analytics.roleSpecific.topCustomers.map(customer => 
                `<tr><td>${customer.customerName}</td><td>$${customer.caseValue.toLocaleString()}</td><td>${customer.status}</td></tr>`
              ).join('')}
            </table>
          </div>
          
          <div class="metric">
            <h3>Vehicle Statistics</h3>
            <p><strong>Total Vehicles:</strong> ${analytics.vehicles.totalVehicles}</p>
            <p><strong>Average Vehicle Value:</strong> $${analytics.vehicles.averageValue.toLocaleString()}</p>
            <p><strong>Lowest Value:</strong> ${analytics.vehicles.lowestValue ? `$${analytics.vehicles.lowestValue.toLocaleString()}` : 'N/A'}</p>
            <p><strong>Highest Value:</strong> ${analytics.vehicles.highestValue ? `$${analytics.vehicles.highestValue.toLocaleString()}` : 'N/A'}</p>
          </div>
        </body>
      </html>
    `
    
    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `estimator-report-${user?.firstName}-${user?.lastName}-${timeRange}-${new Date().toISOString().split('T')[0]}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading your reports...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estimator Performance Dashboard</h1>
          <p className="text-gray-600">Performance analytics for estimator {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex gap-2">
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
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button> 
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "performance", label: "Performance", icon: TrendingUp },
          { id: "time", label: "Time Tracking", icon: Clock },
          { id: "customers", label: "Customers", icon: Users },
        { id: "quotes", label: "Quotes", icon: DollarSign }
        ].map((type) => (
          <Button
            key={type.id}
            variant={reportType === type.id ? "default" : "outline"}
            size="sm"
            onClick={() => setReportType(type.id)}
          >
            <type.icon className="h-4 w-4 mr-2" />
            {type.label}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.overview.totalRevenue.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">${analytics.overview.averageCaseValue.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{analytics.overview.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Cases completed successfully
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overview Section */}
      {reportType === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">This Month</p>
                    <p className="text-sm text-muted-foreground">{analytics.performance.casesThisMonth} cases</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${analytics.performance.revenueThisMonth.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Last Month</p>
                    <p className="text-sm text-muted-foreground">{analytics.performance.casesLastMonth} cases</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">${analytics.performance.revenueLastMonth.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Vehicles:</span>
                  <span className="font-semibold">{analytics.vehicles.totalVehicles}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Value:</span>
                  <span className="font-semibold">${analytics.vehicles.averageValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Lowest Value:</span>
                  <span className="font-semibold">
                    {analytics.vehicles.lowestValue ? `$${analytics.vehicles.lowestValue.toLocaleString()}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Highest Value:</span>
                  <span className="font-semibold">
                    {analytics.vehicles.highestValue ? `$${analytics.vehicles.highestValue.toLocaleString()}` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Section */}
      {reportType === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Processing Time */}
          <Card>
            <CardHeader>
              <CardTitle>Average Processing Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                {Math.round(analytics.timeTracking.averageTimePerCase / (1000 * 60))} minutes
                </div>
                <p className="text-sm text-muted-foreground">per case</p>
              </div>
            </CardContent>
          </Card>

          {/* Active vs Completed */}
          <Card>
            <CardHeader>
              <CardTitle>Case Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: analytics.overview.completedCases },
                      { name: 'Active', value: analytics.overview.activeCases }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#00C49F" />
                    <Cell fill="#FFBB28" />
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Tracking Section */}
      {reportType === "time" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Spent */}
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Time per Case:</span>
                  <span className="font-semibold">
                    {Math.round(analytics.timeTracking.averageTimePerCase / (1000 * 60))} minutes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analytics.timeTracking.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">
                        {activity.customer?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.vehicle ? `${activity.vehicle.year} ${activity.vehicle.make} ${activity.vehicle.model}` : 'No vehicle'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium capitalize">{activity.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customers Section */}
      {reportType === "customers" && (
        <div className="grid grid-cols-1 gap-6">
          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.roleSpecific.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{customer.customerName}</p>
                        <p className="text-sm text-muted-foreground capitalize">{customer.status}</p>
                        <p className="text-xs text-muted-foreground capitalize">Quote: ${customer.quoteAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">${customer.caseValue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Case Value</p>
                      <p className="text-xs text-muted-foreground capitalize">{customer.quoteStatus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quotes Section */}
      {reportType === "quotes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quote Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Total Quotes</p>
                    <p className="text-sm text-muted-foreground">All quotes generated</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{analytics.roleSpecific.totalQuotes}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Accepted Quotes</p>
                    <p className="text-sm text-muted-foreground">Successfully closed</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{analytics.roleSpecific.acceptedQuotes}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Declined Quotes</p>
                    <p className="text-sm text-muted-foreground">Not accepted</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{analytics.roleSpecific.declinedQuotes}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Negotiating</p>
                    <p className="text-sm text-muted-foreground">In discussion</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-yellow-600">{analytics.roleSpecific.negotiatingQuotes}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Pending</p>
                    <p className="text-sm text-muted-foreground">Awaiting decision</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-600">{analytics.roleSpecific.pendingQuotes}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Values */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Total Quote Value</p>
                    <p className="text-sm text-muted-foreground">All quotes combined</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">${analytics.roleSpecific.totalQuoteValue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Accepted Quote Value</p>
                    <p className="text-sm text-muted-foreground">Revenue from accepted quotes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${analytics.roleSpecific.acceptedQuoteValue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Average Quote Amount</p>
                    <p className="text-sm text-muted-foreground">Per quote</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-600">${analytics.roleSpecific.averageQuoteAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Acceptance Rate</p>
                    <p className="text-sm text-muted-foreground">Quote success rate</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{analytics.roleSpecific.quoteAcceptanceRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quote Acceptance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.roleSpecific.quoteAcceptanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Quote success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quote Value</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.roleSpecific.averageQuoteAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average per quote
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.roleSpecific.totalQuotes}</div>
            <p className="text-xs text-muted-foreground">
              Quotes generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Quotes</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.roleSpecific.acceptedQuotes}</div>
            <p className="text-xs text-muted-foreground">
              Successfully closed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 