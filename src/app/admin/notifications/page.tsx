"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLoading } from "@/hooks/use-loading"
import { useToast } from "@/hooks/use-toast"
import { Database, Notification } from "@/lib/database"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  Bell, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Shield, 
  Clock,
  Archive,
} from "lucide-react"

import { CardSkeleton } from "@/components/ui/loader"

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    const adminRoles = ["audit_manager", "auditor", "management", "super_admin"]
    if (!adminRoles.includes(session.user.role)) {
      router.push("/client")
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

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
          action: "mark_read"
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, status: "read", readAt: new Date().toISOString() } : n
          )
        )
        toast({
          title: "Success",
          description: "Notification marked as read",
          variant: "success",
        })
      } else {
        console.error("Failed to mark notification as read:", data.error)
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (notification.status === "unread") {
      handleMarkAsRead(notification.id)
    }
    
    // Navigate to appropriate page based on notification type and metadata
    if (notification.metadata?.auditId) {
      router.push(`/admin/audits/${notification.metadata.auditId}`)
    } else if (notification.metadata?.reportId) {
      router.push(`/admin/reports/${notification.metadata.reportId}`)
    } else if (notification.metadata?.userId) {
      router.push(`/admin/users`)
    } else if (notification.type === "audit_assignment") {
      router.push("/admin/audits")
    } else if (notification.type === "report_ready") {
      router.push("/admin/reports")
    } else if (notification.type === "security_alert") {
      router.push("/admin/alerts")
    }
    // For other notifications, stay on the notifications page
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status === "unread")
      
      for (const notification of unreadNotifications) {
        await handleMarkAsRead(notification.id)
      }
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "success",
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    }
  }

  const handleArchive = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
          action: "archive"
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, status: "archived" } : n
          )
        )
        toast({
          title: "Success",
          description: "Notification archived",
          variant: "success",
        })
      } else {
        console.error("Failed to archive notification:", data.error)
        toast({
          title: "Error",
          description: "Failed to archive notification",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error archiving notification:", error)
      toast({
        title: "Error",
        description: "Failed to archive notification",
        variant: "destructive",
      })
    }
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
      case "audit_request": return "text-blue-600"
      case "document_request": return "text-green-600"
      case "audit_assignment": return "text-purple-600"
      case "report_ready": return "text-orange-600"
      case "security_alert": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:text-red-900 hover:border-red-400"
      case "high": return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 hover:text-orange-900 hover:border-orange-400"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-900 hover:border-yellow-400"
      case "low": return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:text-green-900 hover:border-green-400"
      default: return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-400"
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTab = selectedTab === "all" || 
                      (selectedTab === "unread" && notification.status === "unread") ||
                      (selectedTab === "read" && notification.status === "read") ||
                      (selectedTab === "archived" && notification.status === "archived")
    
    return matchesSearch && matchesTab
  })

  const unreadCount = notifications.filter(n => n.status === "unread").length
  const readCount = notifications.filter(n => n.status === "read").length
  const archivedCount = notifications.filter(n => n.status === "archived").length

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">Manage your notifications</p>
            </div>
          </div>
          <CardSkeleton />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Manage your notifications</p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>All</span>
              <Badge variant="secondary" className="ml-1">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Unread</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Read</span>
              <Badge variant="secondary" className="ml-1">{readCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center space-x-2">
              <Archive className="h-4 w-4" />
              <span>Archived</span>
              <Badge variant="secondary" className="ml-1">{archivedCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                      notification.status === "unread" ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`mt-1 ${getTypeColor(notification.type)}`}>
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold">{notification.title}</h3>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              {notification.status === "unread" && (
                                <Badge variant="default" className="bg-blue-600">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-3">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{new Date(notification.createdAt).toLocaleString()}</span>
                              {notification.readAt && (
                                <span>Read: {new Date(notification.readAt).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {notification.status === "unread" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          {notification.status !== "archived" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleArchive(notification.id)}
                            >
                              <Archive className="h-4 w-4 mr-1" />
                              Archive
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try adjusting your search criteria" : "You're all caught up!"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
