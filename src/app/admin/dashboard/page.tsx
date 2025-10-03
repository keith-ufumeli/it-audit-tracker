"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader, CardSkeleton } from "@/components/ui/loader"
import { useLoading } from "@/hooks/use-loading"
import { Database, Audit, Activity, Notification } from "@/lib/database"
import AdminLayout from "@/components/admin/admin-layout"
import AuditStatusChart from "@/components/charts/AuditStatusChart"
import PriorityDistributionChart from "@/components/charts/PriorityDistributionChart"
import { 
  Shield, 
  Users, 
  FileText, 
  BarChart3, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Activity as ActivityIcon,
  CheckCircle2,
  Calendar,
  Sparkles
} from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading("Loading dashboard...")
  const [stats, setStats] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [audits, setAudits] = useState<Audit[]>([])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      router.push("/client")
      return
    }

    loadDashboardData()
  }, [session, status, router])

  const loadDashboardData = async () => {
    startLoading("Loading dashboard data...")
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const dashboardStats = Database.getStats()
      const activities = Database.getRecentActivities(10)
      const userNotifications = Database.getUnreadNotificationsByUser(session?.user?.id || "")
      const allAudits = Database.getAudits()
      
      setStats(dashboardStats)
      setRecentActivities(activities)
      setNotifications(userNotifications)
      setAudits(allAudits)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      stopLoading()
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
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
      </AdminLayout>
    )
  }

  if (!session || !stats) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100"
      case "in_progress": return "text-blue-600 bg-blue-100"
      case "planning": return "text-purple-600 bg-purple-100"
      case "on_hold": return "text-yellow-600 bg-yellow-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-100"
      case "medium": return "text-orange-600 bg-orange-100"
      case "low": return "text-green-600 bg-green-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent tracking-tight">
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Welcome back, {session.user.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Here's what's happening with your audits today
            </p>
          </div>
          <Button 
            onClick={loadDashboardData} 
            variant="outline" 
            size="lg"
            className="hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <ActivityIcon className="h-5 w-5 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Active Audits</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {stats.audits.byStatus.in_progress || 0}
              </div>
              <p className="text-sm text-muted-foreground flex items-center font-medium">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                {stats.audits.total} total audits
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Documents</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600 mb-2">{stats.documents.total}</div>
              <p className="text-sm text-muted-foreground flex items-center font-medium">
                <Clock className="h-4 w-4 mr-2 text-orange-600" />
                {stats.documents.byStatus.pending || 0} pending review
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Total Users</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 mb-2">{stats.users.total}</div>
              <p className="text-sm text-muted-foreground flex items-center font-medium">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                {stats.users.active} active users
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Alerts</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600 mb-2">{stats.notifications.unread}</div>
              <p className="text-sm text-muted-foreground flex items-center font-medium">
                <Sparkles className="h-4 w-4 mr-2 text-red-600" />
                {stats.notifications.total} total notifications
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Audit Progress Overview */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
                  Active Audits Overview
                </CardTitle>
                <CardDescription className="mt-2">
                  Track progress of ongoing audits
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/admin/audits")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {audits.filter(a => a.status !== "completed").slice(0, 3).map((audit) => (
                <div key={audit.id} className="group hover:bg-accent/50 p-4 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold group-hover:text-primary transition-colors">{audit.title}</h4>
                        <Badge className={getPriorityColor(audit.priority)}>
                          {audit.priority}
                        </Badge>
                        <Badge className={getStatusColor(audit.status)}>
                          {audit.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {audit.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{audit.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                        style={{ width: `${audit.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {audit.assignedAuditors.length} auditor{audit.assignedAuditors.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
                Audit Status Distribution
              </CardTitle>
              <CardDescription>
                Overview of audits by current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditStatusChart
                data={[
                  { name: "In Progress", value: stats.audits.byStatus.in_progress || 0, color: "#3b82f6" },
                  { name: "Planning", value: stats.audits.byStatus.planning || 0, color: "#a855f7" },
                  { name: "Completed", value: stats.audits.byStatus.completed || 0, color: "#22c55e" },
                  { name: "Cancelled", value: stats.audits.byStatus.cancelled || 0, color: "#ef4444" },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-red-600" />
                Priority Distribution
              </CardTitle>
              <CardDescription>
                Audit priority breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PriorityDistributionChart
                data={[
                  { name: "Critical", value: audits.filter(a => a.priority === "critical").length, color: "#dc2626" },
                  { name: "High", value: audits.filter(a => a.priority === "high").length, color: "#f97316" },
                  { name: "Medium", value: audits.filter(a => a.priority === "medium").length, color: "#eab308" },
                  { name: "Low", value: audits.filter(a => a.priority === "low").length, color: "#22c55e" },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ActivityIcon className="h-5 w-5 mr-2 text-blue-600" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Latest system activities and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 6).map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors animate-in slide-in-from-left duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.userName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activities
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                Notifications
              </CardTitle>
              <CardDescription>
                Unread notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.slice(0, 6).map((notification, index) => (
                    <div 
                      key={notification.id} 
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer animate-in slide-in-from-right duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className={`h-2 w-2 rounded-full ${
                          notification.priority === 'high' ? 'bg-red-500 animate-pulse' :
                          notification.priority === 'medium' ? 'bg-orange-500' :
                          'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No unread notifications
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
