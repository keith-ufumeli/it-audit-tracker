"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLoading } from "@/hooks/use-loading"
import { Database, Notification } from "@/lib/database"
import ClientLayout from "@/components/client/client-layout"
import { 
  Bell,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  RefreshCw,
  FileText,
  Shield
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loader"

export default function ClientNotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    const clientRoles = ["client", "department"]
    if (!clientRoles.includes(session.user.role)) {
      router.push("/admin/dashboard")
      return
    }

    loadNotifications()
  }, [session, status, router])

  const loadNotifications = async () => {
    startLoading("Loading notifications...")
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const allNotifications = Database.getNotificationsByUser(session?.user?.id || "")
      setNotifications(allNotifications)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      stopLoading()
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    // In real app, this would update the database
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, status: "read", readAt: new Date().toISOString() } : n
      )
    )
    console.log("Marked as read:", notificationId)
  }

  const handleMarkAllAsRead = () => {
    // In real app, this would update the database
    setNotifications(prev => 
      prev.map(n => ({ ...n, status: "read", readAt: new Date().toISOString() }))
    )
    console.log("Marked all as read")
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "audit_request": return <Shield className="h-5 w-5" />
      case "document_request": return <FileText className="h-5 w-5" />
      case "audit_assignment": return <CheckCircle className="h-5 w-5" />
      case "report_ready": return <FileText className="h-5 w-5" />
      case "security_alert": return <AlertTriangle className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "audit_request": return "bg-blue-100 text-blue-600"
      case "document_request": return "bg-orange-100 text-orange-600"
      case "audit_assignment": return "bg-green-100 text-green-600"
      case "report_ready": return "bg-purple-100 text-purple-600"
      case "security_alert": return "bg-red-100 text-red-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-100"
      case "medium": return "text-orange-600 bg-orange-100"
      case "low": return "text-blue-600 bg-blue-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = selectedTab === "all" || notification.status === selectedTab
    return matchesSearch && matchesTab
  })

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups: { [key: string]: Notification[] }, notification) => {
    const date = new Date(notification.createdAt).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(notification)
    return groups
  }, {})

  if (status === "loading" || isLoading) {
    return (
      <ClientLayout>
        <div className="p-6 space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (!session) return null

  const unreadCount = notifications.filter(n => n.status === "unread").length

  return (
    <ClientLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadNotifications}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{notifications.length}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {notifications.filter(n => n.priority === "high" && n.status === "unread").length}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {notifications.filter(n => {
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return new Date(n.createdAt) > weekAgo
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Read
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center space-x-2 px-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-muted-foreground">{date}</h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  
                  <div className="space-y-3">
                    {dateNotifications.map((notification, index) => (
                      <Card 
                        key={notification.id}
                        className={`group hover:shadow-md transition-all duration-300 cursor-pointer animate-in slide-in-from-left ${
                          notification.status === "unread" ? "bg-blue-50/50" : ""
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                        onClick={() => notification.status === "unread" && handleMarkAsRead(notification.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            {/* Icon */}
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getTypeColor(notification.type)} flex items-center justify-center`}>
                              {getTypeIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge className={getPriorityColor(notification.priority)}>
                                  {notification.priority}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {notification.type.replace('_', ' ')}
                                </Badge>
                                {notification.status === "unread" && (
                                  <Badge className="bg-blue-500 text-white text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                              
                              <h4 className="font-semibold text-lg mb-1">
                                {notification.title}
                              </h4>

                              <p className="text-sm text-muted-foreground mb-3">
                                {notification.message}
                              </p>

                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(notification.createdAt).toLocaleTimeString()}
                                </div>
                                {notification.readAt && (
                                  <div className="flex items-center text-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Read {new Date(notification.readAt).toLocaleString()}
                                  </div>
                                )}
                                {notification.expiresAt && (
                                  <div className="flex items-center text-orange-600">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Expires {new Date(notification.expiresAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>

                              {/* Metadata */}
                              {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                      View details
                                    </summary>
                                    <div className="mt-2 space-y-1">
                                      {Object.entries(notification.metadata).map(([key, value]) => (
                                        <div key={key} className="flex items-center space-x-2">
                                          <span className="font-medium">{key}:</span>
                                          <span>{String(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                </div>
                              )}
                            </div>

                            {/* Action */}
                            {notification.status === "unread" && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsRead(notification.id)
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredNotifications.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try adjusting your search query" : "You're all caught up!"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  )
}

