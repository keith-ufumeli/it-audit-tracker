"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Database,
  Network,
  User,
  Clock
} from "lucide-react"

interface ErrorStats {
  totalErrors: number
  errorsByCategory: Record<string, number>
  errorsBySeverity: Record<string, number>
  topErrors: Array<{ code: string; count: number }>
}

export default function ErrorMonitoringPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all")

  useEffect(() => {
    loadErrorStats()
  }, [])

  const loadErrorStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/error-monitoring')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error("Error loading error stats:", error)
      toast({
        title: "Error",
        description: "Failed to load error statistics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'validation': return <User className="h-4 w-4" />
      case 'authentication': return <Shield className="h-4 w-4" />
      case 'authorization': return <Shield className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
      case 'network': return <Network className="h-4 w-4" />
      case 'system': return <Activity className="h-4 w-4" />
      case 'business': return <TrendingUp className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (session?.user?.role !== "super_admin") {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Only super administrators can access error monitoring.
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Error Monitoring</h1>
            <p className="text-muted-foreground">
              Monitor system errors and performance metrics
            </p>
          </div>
          <Button onClick={loadErrorStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalErrors.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.errorsBySeverity.critical || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Severity</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.errorsBySeverity.high || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Errors</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.errorsByCategory.system || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search errors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                    <SelectItem value="authorization">Authorization</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Analysis */}
        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="severity">By Severity</TabsTrigger>
            <TabsTrigger value="top-errors">Top Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Errors by Category</CardTitle>
                <CardDescription>
                  Distribution of errors across different categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && Object.entries(stats.errorsByCategory)
                    .filter(([category]) => 
                      selectedCategory === "all" || category === selectedCategory
                    )
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(category)}
                          <div>
                            <div className="font-medium capitalize">{category}</div>
                            <div className="text-sm text-muted-foreground">
                              {count} error{count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-sm text-muted-foreground">
                            {stats.totalErrors > 0 ? 
                              Math.round((count / stats.totalErrors) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="severity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Errors by Severity</CardTitle>
                <CardDescription>
                  Distribution of errors by severity level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && Object.entries(stats.errorsBySeverity)
                    .filter(([severity]) => 
                      selectedSeverity === "all" || severity === selectedSeverity
                    )
                    .sort(([, a], [, b]) => b - a)
                    .map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={getSeverityColor(severity)}>
                            {severity.toUpperCase()}
                          </Badge>
                          <div>
                            <div className="font-medium capitalize">{severity} Severity</div>
                            <div className="text-sm text-muted-foreground">
                              {count} error{count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-sm text-muted-foreground">
                            {stats.totalErrors > 0 ? 
                              Math.round((count / stats.totalErrors) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top-errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Errors</CardTitle>
                <CardDescription>
                  Most frequently occurring errors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && stats.topErrors
                    .filter(({ code }) => 
                      searchTerm === "" || code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(({ code, count }, index) => (
                      <div key={code} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium font-mono">{code}</div>
                            <div className="text-sm text-muted-foreground">
                              {count} occurrence{count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-sm text-muted-foreground">
                            {stats.totalErrors > 0 ? 
                              Math.round((count / stats.totalErrors) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Health Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Status</CardTitle>
            <CardDescription>
              Overall system health indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">System Status</div>
                  <div className="text-sm text-green-600">Healthy</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Uptime</div>
                  <div className="text-sm text-blue-600">99.9%</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
                  <Activity className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium">Error Rate</div>
                  <div className="text-sm text-yellow-600">0.1%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
