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
  Download
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
import api from "@/lib/api"


interface ReportStats {
  totalCases: number
  totalRevenue: number
  avgCaseValue: number
  completionRate: number
  avgProcessingTime: number
  avgInspectionRating: number
  casesByStatus: Record<string, number>
  casesByStage: Record<string, number>
  revenueByMonth: Array<{ month: string; revenue: number; cases: number }>
  casesByDay: Array<{ date: string; cases: number; revenue: number }>
  topVehicles: Array<{ make: string; model: string; count: number; avgValue: number }>
  agentPerformance: Array<{ agentId: string; agentName: string; cases: number; revenue: number; avgRating: number }>
  decisionBreakdown: Array<{ decision: string; count: number; percentage: number }>
  stageProgression: Array<{ stage: number; count: number; avgTime: number }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function ReportsDashboard() {
  const [stats, setStats] = useState<ReportStats>({
    totalCases: 0,
    totalRevenue: 0,
    avgCaseValue: 0,
    completionRate: 0,
    avgProcessingTime: 0,
    avgInspectionRating: 0,
    casesByStatus: {},
    casesByStage: {},
    revenueByMonth: [],
    casesByDay: [],
    topVehicles: [],
    agentPerformance: [],
    decisionBreakdown: [],
    stageProgression: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [reportType, setReportType] = useState("overview")

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.getAnalytics(timeRange)
      
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  const exportPDF = () => {
    // Create a simple HTML report for PDF generation
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>VOS Report - ${timeRange}</title>
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
            <h1>VOS System Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} for ${timeRange}</p>
          </div>
          
          <div class="metric">
            <h3>Key Metrics</h3>
            <p><strong>Total Cases:</strong> <span class="highlight">${stats.totalCases}</span></p>
            <p><strong>Total Purchase Value:</strong> <span class="highlight">$${stats.totalRevenue.toLocaleString()}</span></p>
            <p><strong>Average Purchase Value:</strong> <span class="highlight">$${stats.avgCaseValue.toLocaleString()}</span></p>
            <p><strong>Completion Rate:</strong> <span class="highlight">${stats.completionRate.toFixed(1)}%</span></p>
            <p><strong>Average Processing Time:</strong> <span class="highlight">${stats.avgProcessingTime.toFixed(1)} days</span></p>
            <p><strong>Average Inspection Rating:</strong> <span class="highlight">${stats.avgInspectionRating.toFixed(1)}/5</span></p>
          </div>
          
          <div class="metric">
            <h3>Cases by Status</h3>
            <table>
              <tr><th>Status</th><th>Count</th></tr>
              ${Object.entries(stats.casesByStatus).map(([status, count]) => 
                `<tr><td>${status}</td><td>${count}</td></tr>`
              ).join('')}
            </table>
          </div>
          
          <div class="metric">
            <h3>Top Performing Agents</h3>
            <table>
              <tr><th>Agent</th><th>Cases</th><th>Revenue</th><th>Avg Rating</th></tr>
              ${stats.agentPerformance.map(agent => 
                `<tr><td>${agent.agentName}</td><td>${agent.cases}</td><td>$${agent.revenue.toLocaleString()}</td><td>${agent.avgRating.toFixed(1)}</td></tr>`
              ).join('')}
            </table>
          </div>
          
          <div class="metric">
            <h3>Top Vehicles</h3>
            <table>
              <tr><th>Make</th><th>Model</th><th>Count</th><th>Avg Value</th></tr>
              ${stats.topVehicles.map(vehicle => 
                `<tr><td>${vehicle.make}</td><td>${vehicle.model}</td><td>${vehicle.count}</td><td>$${vehicle.avgValue.toLocaleString()}</td></tr>`
              ).join('')}
            </table>
          </div>
        </body>
      </html>
    `
    
    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vos-report-${timeRange}-${new Date().toISOString().split('T')[0]}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
        
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
              <SelectItem value="all">All time</SelectItem>
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
          { id: "revenue", label: "Purchase Value", icon: DollarSign },
          { id: "performance", label: "Performance", icon: TrendingUp },
          { id: "analytics", label: "Analytics", icon: Activity }
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
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From completed purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Purchase Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgCaseValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average per vehicle
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

      {/* Charts Section */}
      {reportType === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Value Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Purchase Value']} />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cases by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Cases by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={Object.entries(stats.casesByStatus).map(([status, count]) => ({ name: status, value: count }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(stats.casesByStatus).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={stats.casesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `$${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'Purchase Value' : 'Vehicles'
                  ]} />
                  <Bar yAxisId="left" dataKey="cases" fill="#82ca9d" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#ff7300" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stage Progression */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.stageProgression}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'avgTime' ? `${(value as number).toFixed(1)} days` : value,
                    name === 'avgTime' ? 'Avg Time' : 'Cases'
                  ]} />
                  <Bar dataKey="count" fill="#8884d8" />
                  <Line type="monotone" dataKey="avgTime" stroke="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "revenue" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Purchase Value (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={stats.casesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `$${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'Purchase Value' : 'Vehicles'
                  ]} />
                  <Bar yAxisId="left" dataKey="cases" fill="#8884d8" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#ff7300" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Purchase Value</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Purchase Value']} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.agentPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="agentName" type="category" width={80} />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `$${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'Purchase Value' : 'Vehicles'
                  ]} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stage Progression */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.stageProgression}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'avgTime' ? `${(value as number).toFixed(1)} days` : value,
                    name === 'avgTime' ? 'Avg Time' : 'Cases'
                  ]} />
                  <Bar dataKey="count" fill="#8884d8" />
                  <Line type="monotone" dataKey="avgTime" stroke="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Decision Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Offer Decision Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={stats.decisionBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ decision, percentage }) => `${decision} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.decisionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle>Top Vehicles by Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topVehicles} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="model" type="category" width={100} />
                  <Tooltip formatter={(value, name) => [
                    name === 'avgValue' ? `$${value.toLocaleString()}` : value,
                    name === 'avgValue' ? 'Avg Purchase Value' : 'Count'
                  ]} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats.casesByDay.slice(-10).reverse().map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{day.date}</p>
                      <p className="text-sm text-muted-foreground">{day.cases} cases</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${day.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Purchase Value</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats.agentPerformance.map((agent, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{agent.agentName}</p>
                      <p className="text-sm text-muted-foreground">{agent.cases} cases</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${agent.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.avgRating > 0 ? `${agent.avgRating.toFixed(1)}★` : 'No ratings'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 