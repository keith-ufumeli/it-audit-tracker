"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLoading } from "@/hooks/use-loading"
import { Database, Activity } from "@/lib/database"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  Activity as ActivityIcon,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  FileText,
  LogIn,
  Upload,
  Edit,
  Trash,
  Shield,
  RefreshCw
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loader"

export default function ActivitiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const [activities, setActivities] = useState<Activity[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("all")

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

    loadActivities()
  }, [session, status, router])

  const loadActivities = async () => {
    startLoading("Loading activities...")
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      const allActivities = Database.getRecentActivities(50)
      setActivities(allActivities)
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      stopLoading()
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "login": return <LogIn className="h-4 w-4" />
      case "document_upload": return <Upload className="h-4 w-4" />
      case "document_request": return <FileText className="h-4 w-4" />
      case "audit_update": return <Edit className="h-4 w-4" />
      case "user_creation": return <User className="h-4 w-4" />
      case "report_generation": return <FileText className="h-4 w-4" />
      default: return <ActivityIcon className="h-4 w-4" />
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <XCircle className="h-4 w-4" />
      case "warning": return <AlertTriangle className="h-4 w-4" />
      case "info": return <Info className="h-4 w-4" />
      case "success": return <CheckCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-100"
      case "warning": return "text-orange-600 bg-orange-100"
      case "info": return "text-blue-600 bg-blue-100"
      case "success": return "text-green-600 bg-green-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "audit_manager": return "bg-orange-500"
      case "auditor": return "bg-blue-500"
      case "management": return "bg-green-500"
      case "client": return "bg-purple-500"
      case "department": return "bg-cyan-500"
      default: return "bg-gray-500"
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.action.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = selectedSeverity === "all" || activity.severity === selectedSeverity
    return matchesSearch && matchesSeverity
  })

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups: { [key: string]: Activity[] }, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {})

  if (status === "loading" || isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!session) return null

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Activity Logs
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor system events and user actions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadActivities}
              className="hover:bg-primary/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="hover:bg-primary/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{activities.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 50 events</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {activities.filter(a => a.severity === "info").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Normal operations</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {activities.filter(a => a.severity === "warning").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Attention needed</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {activities.filter(a => a.severity === "critical").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Immediate action required</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Severity Tabs */}
        <Tabs value={selectedSeverity} onValueChange={setSelectedSeverity} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              All
            </TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Info
            </TabsTrigger>
            <TabsTrigger value="success" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Success
            </TabsTrigger>
            <TabsTrigger value="warning" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Warnings
            </TabsTrigger>
            <TabsTrigger value="critical" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Critical
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedSeverity} className="mt-6">
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([date, dateActivities]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center space-x-2 px-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-muted-foreground">{date}</h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  
                  <div className="space-y-2">
                    {dateActivities.map((activity, index) => (
                      <Card 
                        key={activity.id}
                        className="group hover:shadow-md transition-all duration-300 hover:bg-accent/50 animate-in slide-in-from-left"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                              <div className={`h-10 w-10 rounded-full ${getSeverityColor(activity.severity)} flex items-center justify-center`}>
                                {getActionIcon(activity.action)}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge className={`${getRoleColor(activity.userRole)} text-white`}>
                                  {activity.userRole.replace('_', ' ')}
                                </Badge>
                                <Badge className={getSeverityColor(activity.severity)}>
                                  <div className="flex items-center space-x-1">
                                    {getSeverityIcon(activity.severity)}
                                    <span className="capitalize">{activity.severity}</span>
                                  </div>
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-2 mb-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{activity.userName}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-sm text-muted-foreground capitalize">
                                  {activity.action.replace('_', ' ')}
                                </span>
                              </div>

                              <p className="text-sm text-foreground mb-2">
                                {activity.description}
                              </p>

                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(activity.timestamp).toLocaleTimeString()}
                                </div>
                                <div className="flex items-center">
                                  <Shield className="h-3 w-3 mr-1" />
                                  {activity.ipAddress}
                                </div>
                                {activity.resource && (
                                  <div className="flex items-center">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {activity.resource}
                                  </div>
                                )}
                              </div>

                              {/* Metadata */}
                              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                      View metadata
                                    </summary>
                                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                      {JSON.stringify(activity.metadata, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredActivities.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <ActivityIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No activities found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try adjusting your search query" : "No activities match the selected filter"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

