"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader, CardSkeleton, TableSkeleton } from "@/components/ui/loader"
import { useLoading } from "@/hooks/use-loading"
import { Database, Audit, Document, Activity, Notification } from "@/lib/database"
import { 
  Shield, 
  Users, 
  FileText, 
  BarChart3, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Activity as ActivityIcon
} from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading("Loading dashboard...")
  const [stats, setStats] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Check if user has admin access
    const adminRoles = ["audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      router.push("/client")
      return
    }

    loadDashboardData()
  }, [session, status, router])

  const loadDashboardData = async () => {
    startLoading("Loading dashboard data...")
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const dashboardStats = Database.getStats()
      const activities = Database.getRecentActivities(10)
      const userNotifications = Database.getUnreadNotificationsByUser(session?.user?.id || "")
      
      setStats(dashboardStats)
      setRecentActivities(activities)
      setNotifications(userNotifications)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      stopLoading()
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded animate-pulse w-1/3" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (!session || !stats) {
    return null
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "audit_manager": return "Audit Manager"
      case "auditor": return "Auditor"
      case "management": return "Management"
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "audit_manager": return "bg-orange_web-500"
      case "auditor": return "bg-blue-500"
      case "management": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${getRoleColor(session.user.role)} text-white`}>
              {getRoleDisplayName(session.user.role)}
            </Badge>
            <Button onClick={loadDashboardData} variant="outline" size="sm">
              <ActivityIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.users.active} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Audits</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.audits.byStatus.in_progress || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.audits.total} total audits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.documents.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.documents.byStatus.pending || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notifications.unread}</div>
              <p className="text-xs text-muted-foreground">
                {stats.notifications.total} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities and Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ActivityIcon className="h-5 w-5 mr-2" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Latest system activities and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.userName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activities
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
              <CardDescription>
                Unread notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-2 w-2 rounded-full mt-2 ${
                          notification.priority === 'high' ? 'bg-destructive' :
                          notification.priority === 'medium' ? 'bg-orange_web-500' :
                          'bg-muted'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No unread notifications
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Role Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>
              Users by role and department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.users.byRole).map(([role, count]) => (
                <div key={role} className="text-center">
                  <div className="text-2xl font-bold">{count as number}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {role.replace('_', ' ')}
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
