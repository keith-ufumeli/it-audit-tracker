"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLoading } from "@/hooks/use-loading"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  Activity,
  Eye,
  EyeOff
} from "lucide-react"

interface AuditTrailEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  sessionId: string
  action: string
  resource: string
  resourceId?: string
  resourceType: string
  beforeState?: any
  afterState?: any
  ipAddress: string
  userAgent: string
  endpoint: string
  method: string
  statusCode: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  complianceRelevant: boolean
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted'
  description: string
  metadata: Record<string, any>
  tags: string[]
  correlationId?: string
  parentActionId?: string
}

interface AuditTrailStats {
  totalEntries: number
  entriesByAction: Record<string, number>
  entriesByRiskLevel: Record<string, number>
  entriesByUser: Record<string, number>
  complianceRelevantCount: number
  criticalRiskCount: number
  timeRange: {
    start: string
    end: string
  }
}

export default function AuditTrailPage() {
  const { data: session } = useSession()
  const { startLoading, stopLoading } = useLoading()
  const [entries, setEntries] = useState<AuditTrailEntry[]>([])
  const [stats, setStats] = useState<AuditTrailStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all")
  const [selectedAction, setSelectedAction] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [complianceOnly, setComplianceOnly] = useState(false)
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({})

  const loadAuditTrail = useCallback(async () => {
    startLoading("Loading audit trail...")
    try {
      const params = new URLSearchParams()
      if (selectedRiskLevel !== "all") params.append('riskLevel', selectedRiskLevel)
      if (selectedAction !== "all") params.append('action', selectedAction)
      if (selectedUser !== "all") params.append('userId', selectedUser)
      if (complianceOnly) params.append('complianceRelevant', 'true')
      params.append('limit', '100')

      const response = await fetch(`/api/audit-trail?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setEntries(result.data)
        setStats(result.stats)
      }
    } catch (error) {
      console.error("Error loading audit trail:", error)
    } finally {
      stopLoading()
    }
  }, [selectedRiskLevel, selectedAction, selectedUser, complianceOnly, startLoading, stopLoading])

  useEffect(() => {
    loadAuditTrail()
  }, [loadAuditTrail])

  const filteredEntries = entries.filter(entry => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        entry.userName.toLowerCase().includes(searchLower) ||
        entry.action.toLowerCase().includes(searchLower) ||
        entry.resource.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower) ||
        entry.endpoint.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDataClassificationColor = (classification: string) => {
    switch (classification) {
      case 'restricted': return 'bg-red-100 text-red-800'
      case 'confidential': return 'bg-orange-100 text-orange-800'
      case 'internal': return 'bg-blue-100 text-blue-800'
      case 'public': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const toggleDetails = (entryId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }))
  }

  const exportAuditTrail = async () => {
    try {
      const response = await fetch('/api/audit-trail/export')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting audit trail:", error)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit Trail</h1>
            <p className="text-muted-foreground">
              Comprehensive audit trail for all system activities
            </p>
          </div>
          <Button onClick={exportAuditTrail} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEntries.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.criticalRiskCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Relevant</CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.complianceRelevantCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(stats.entriesByUser).length}</div>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Risk Level</label>
                <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Action</label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {stats && Object.keys(stats.entriesByUser).map(userId => (
                      <SelectItem key={userId} value={userId}>
                        {userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant={complianceOnly ? "default" : "outline"}
                  onClick={() => setComplianceOnly(!complianceOnly)}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Compliance Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Trail Entries ({filteredEntries.length})</CardTitle>
            <CardDescription>
              Detailed audit trail of all system activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getRiskLevelColor(entry.riskLevel)}>
                        {entry.riskLevel.toUpperCase()}
                      </Badge>
                      <Badge className={getDataClassificationColor(entry.dataClassification)}>
                        {entry.dataClassification.toUpperCase()}
                      </Badge>
                      {entry.complianceRelevant && (
                        <Badge variant="outline" className="border-blue-200 text-blue-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Compliance
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDetails(entry.id)}
                      >
                        {showDetails[entry.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium">User</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.userName} ({entry.userRole})
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Action</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.action} on {entry.resource}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Endpoint</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.method} {entry.endpoint}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {entry.description}
                  </div>

                  {showDetails[entry.id] && (
                    <div className="border-t pt-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium">IP Address</div>
                          <div className="text-sm text-muted-foreground">{entry.ipAddress}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Session ID</div>
                          <div className="text-sm text-muted-foreground">{entry.sessionId}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Status Code</div>
                          <div className="text-sm text-muted-foreground">{entry.statusCode}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Resource Type</div>
                          <div className="text-sm text-muted-foreground">{entry.resourceType}</div>
                        </div>
                      </div>

                      {entry.tags && entry.tags.length > 0 && (
                        <div>
                          <div className="text-sm font-medium">Tags</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <div>
                          <div className="text-sm font-medium">Metadata</div>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                      {entry.beforeState && (
                        <div>
                          <div className="text-sm font-medium">Before State</div>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(entry.beforeState, null, 2)}
                          </pre>
                        </div>
                      )}

                      {entry.afterState && (
                        <div>
                          <div className="text-sm font-medium">After State</div>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(entry.afterState, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filteredEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No audit trail entries found matching your criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
