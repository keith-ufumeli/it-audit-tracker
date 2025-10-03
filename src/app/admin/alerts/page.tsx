"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLoading } from "@/hooks/use-loading"
import { Database, Alert as AlertType } from "@/lib/database"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  AlertTriangle,
  Bell,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Shield,
  Activity,
  RefreshCw,
  Zap,
  Users,
  FileText,
  Settings
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loader"

export default function AdminAlertsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<AlertType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    const adminRoles = ["audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      router.push("/client")
      return
    }

    loadAlerts()
    initializeWebSocket()

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
        wsRef.current = null
      }
    }
  }, [session, status, router])

  useEffect(() => {
    filterAlerts()
  }, [alerts, searchQuery, selectedSeverity, selectedStatus])

  const loadAlerts = async () => {
    startLoading("Loading alerts...")
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const allAlerts = Database.getAlerts()
      setAlerts(allAlerts)
    } catch (error) {
      console.error("Error loading alerts:", error)
    } finally {
      stopLoading()
    }
  }

  const initializeWebSocket = () => {
    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close()
      }

      // Try to start the WebSocket server first
      fetch('/api/websocket', { method: 'GET' })
        .then(() => {
          console.log('WebSocket server started')
          
          // Wait a moment for server to be ready
          setTimeout(() => {
            const ws = new WebSocket('ws://localhost:8080')
            wsRef.current = ws
            setWsConnection(ws)
            setConnectionStatus('connecting')

            ws.onopen = () => {
              console.log('WebSocket connected successfully')
              setConnectionStatus('connected')
              
              // Subscribe to all alert types
              ws.send(JSON.stringify({
                type: 'subscribe',
                alertTypes: ['all']
              }))
            }

            ws.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data)
                console.log('WebSocket message received:', data)
                
                if (data.type === 'alert') {
                  // New alert received
                  setAlerts(prev => [data.data, ...prev])
                } else if (data.type === 'connection') {
                  console.log('WebSocket connection confirmed:', data.message)
                }
              } catch (error) {
                console.error('Error parsing WebSocket message:', error)
              }
            }

            ws.onclose = (event) => {
              console.log('WebSocket disconnected:', event.code, event.reason)
              setConnectionStatus('disconnected')
              
              // Attempt to reconnect after 5 seconds if not a manual close
              if (event.code !== 1000) {
                setTimeout(() => {
                  if (wsRef.current?.readyState === WebSocket.CLOSED) {
                    console.log('Attempting to reconnect WebSocket...')
                    initializeWebSocket()
                  }
                }, 5000)
              }
            }

            ws.onerror = (error) => {
              console.error('WebSocket error:', error)
              console.error('WebSocket readyState:', ws.readyState)
              console.error('WebSocket url:', ws.url)
              setConnectionStatus('disconnected')
              
              // Try to restart the WebSocket server
              console.log('Attempting to restart WebSocket server...')
              fetch('/api/websocket', { method: 'GET' })
                .catch(err => console.error('Failed to restart WebSocket server:', err))
            }
          }, 1000)
        })
        .catch(error => {
          console.error('Failed to start WebSocket server:', error)
          setConnectionStatus('disconnected')
        })
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
      setConnectionStatus('disconnected')
    }
  }

  const filterAlerts = () => {
    let filtered = alerts

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(alert =>
        alert.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.triggeredByName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Severity filter
    if (selectedSeverity !== "all") {
      filtered = filtered.filter(alert => alert.severity === selectedSeverity)
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(alert => alert.status === selectedStatus)
    }

    setFilteredAlerts(filtered)
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const success = Database.acknowledgeAlert(alertId, session?.user?.id || '')
      if (success) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'acknowledged', acknowledgedBy: session?.user?.id, acknowledgedAt: new Date().toISOString() }
            : alert
        ))
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      const success = Database.resolveAlert(alertId, session?.user?.id || '')
      if (success) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'resolved', resolvedBy: session?.user?.id, resolvedAt: new Date().toISOString() }
            : alert
        ))
      }
    } catch (error) {
      console.error("Error resolving alert:", error)
    }
  }

  const handleDismissAlert = async (alertId: string) => {
    try {
      const success = Database.dismissAlert(alertId)
      if (success) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'dismissed' }
            : alert
        ))
      }
    } catch (error) {
      console.error("Error dismissing alert:", error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-100 border-red-200"
      case "high": return "text-orange-600 bg-orange-100 border-orange-200"
      case "medium": return "text-yellow-600 bg-yellow-100 border-yellow-200"
      case "low": return "text-blue-600 bg-blue-100 border-blue-200"
      default: return "text-gray-600 bg-gray-100 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-red-600 bg-red-100"
      case "acknowledged": return "text-yellow-600 bg-yellow-100"
      case "resolved": return "text-green-600 bg-green-100"
      case "dismissed": return "text-gray-600 bg-gray-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected": return "text-green-600"
      case "connecting": return "text-yellow-600"
      case "disconnected": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!session) return null

  const activeAlerts = alerts.filter(a => a.status === 'active')
  const criticalAlerts = alerts.filter(a => a.severity === 'critical')
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged')
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved')

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
              Security Alerts
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time security monitoring and alert management
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${getConnectionStatusColor()}`} />
              <span className="text-sm text-muted-foreground">
                {connectionStatus === 'connected' ? 'Live' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
            </div>
            <Button 
              onClick={loadAlerts} 
              variant="outline" 
              size="sm"
              className="hover:bg-primary/10 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Connection Status Alert */}
        {connectionStatus === 'disconnected' && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              WebSocket connection is offline. Alerts will not be received in real-time.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{activeAlerts.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{criticalAlerts.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                High priority
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{acknowledgedAlerts.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Under review
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{resolvedAlerts.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedSeverity}
                  aria-label="Severity"
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-3 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={selectedStatus}
                  aria-label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Security Alerts ({filteredAlerts.length})
            </CardTitle>
            <CardDescription>
              Real-time security alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, index) => (
                  <div 
                    key={alert.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 animate-in slide-in-from-left"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{alert.ruleName}</h3>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{alert.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {alert.triggeredByName}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </div>
                          {alert.metadata?.ipAddress && (
                            <div className="flex items-center">
                              <Activity className="h-4 w-4 mr-1" />
                              {alert.metadata.ipAddress}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="hover:bg-yellow-100 hover:text-yellow-800 hover:border-yellow-400"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveAlert(alert.id)}
                              className="hover:bg-green-100 hover:text-green-800 hover:border-green-400"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(alert.id)}
                            className="hover:bg-green-100 hover:text-green-800 hover:border-green-400"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismissAlert(alert.id)}
                          className="hover:bg-gray-200 hover:text-gray-900 hover:border-gray-400"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
                  <p className="text-sm">
                    {alerts.length === 0 
                      ? "No security alerts have been triggered yet."
                      : "No alerts match your current filters."
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
