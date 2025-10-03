"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { Database, Notification } from "@/lib/database"
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Shield, 
  Clock,
  Eye,
  MoreHorizontal
} from "lucide-react"

interface NotificationDropdownProps {
  userId: string
  userRole: string
  portalType: "admin" | "client"
}

export function NotificationDropdown({ userId, userRole, portalType }: NotificationDropdownProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = useCallback(() => {
    const userNotifications = Database.getNotificationsByUser(userId)
    const unreadNotifications = userNotifications.filter(n => n.status === "unread")
    
    setNotifications(userNotifications.slice(0, 5)) // Show latest 5
    setUnreadCount(unreadNotifications.length)
  }, [userId])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

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

      if (response.ok) {
        loadNotifications() // Reload to update counts
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "audit_request": return <Shield className="h-4 w-4" />
      case "document_request": return <FileText className="h-4 w-4" />
      case "audit_assignment": return <CheckCircle className="h-4 w-4" />
      case "report_ready": return <FileText className="h-4 w-4" />
      case "security_alert": return <AlertTriangle className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
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
      case "critical": return "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900"
      case "high": return "bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900"
      case "medium": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900"
      case "low": return "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900"
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900"
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (notification.status === "unread") {
      handleMarkAsRead(notification.id)
    }
    
    // Navigate to appropriate page based on notification type
    if (notification.metadata?.auditId) {
      router.push(`/admin/audits/${notification.metadata.auditId}`)
    } else if (notification.metadata?.reportId) {
      router.push(`/admin/reports/${notification.metadata.reportId}`)
    } else {
      // Navigate to notifications page
      const notificationsPath = portalType === "admin" ? "/admin/notifications" : "/client/notifications"
      router.push(notificationsPath)
    }
  }

  const notificationsPath = portalType === "admin" ? "/admin/notifications" : "/client/notifications"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(notificationsPath)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View All
          </Button>
        </div>
        
        {notifications.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <DropdownMenuItem 
                  className="p-3 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className={`mt-1 ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        {notification.status === "unread" && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
                {index < notifications.length - 1 && <DropdownMenuSeparator />}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => router.push(notificationsPath)}
        >
          <div className="flex items-center space-x-2 w-full">
            <MoreHorizontal className="h-4 w-4" />
            <span>View all notifications</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
