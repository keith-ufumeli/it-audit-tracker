"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLoading } from "@/hooks/use-loading"
import { Database, Document, Notification } from "@/lib/database"
import ClientLayout from "@/components/client/client-layout"
import PriorityDistributionChart from "@/components/charts/PriorityDistributionChart"
import AuditStatusChart from "@/components/charts/AuditStatusChart"
import { 
  Bell,
  FileText,
  Upload,
  Clock,
  Calendar,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  BarChart3
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loader"

export default function ClientDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const [documents, setDocuments] = useState<Document[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  const loadDashboardData = useCallback(async () => {
    startLoading("Loading dashboard...")
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const allDocuments = Database.getDocuments()
      const userNotifications = Database.getUnreadNotificationsByUser(session?.user?.id || "")
      
      // Filter documents for current user
      const userDocs = allDocuments.filter(doc => 
        doc.requestedFrom === session?.user?.id || doc.uploadedBy === session?.user?.id
      )
      
      setDocuments(userDocs)
      setNotifications(userNotifications)
    } catch (error) {
      console.error("Error loading dashboard:", error)
    } finally {
      stopLoading()
    }
  }, [session?.user?.id, startLoading, stopLoading])

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

    loadDashboardData()
  }, [session, status, router, loadDashboardData])

  if (status === "loading" || isLoading) {
    return (
      <ClientLayout>
        <div className="p-6 space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (!session) return null

  const pendingDocs = documents.filter(d => d.status === "pending")
  const submittedDocs = documents.filter(d => d.status === "submitted")
  const unreadNotifications = notifications.filter(n => n.status === "unread")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "text-green-600 bg-green-100"
      case "pending": return "text-orange-600 bg-orange-100"
      case "draft": return "text-gray-600 bg-gray-100"
      default: return "text-gray-600 bg-gray-100"
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

  return (
    <ClientLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent tracking-tight">
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Welcome back, {session.user.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Track your document submissions and audit progress
            </p>
          </div>
          <Button 
            onClick={loadDashboardData} 
            variant="outline" 
            size="lg"
            className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{pendingDocs.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Action required
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{submittedDocs.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Under review
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{unreadNotifications.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Unread messages
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Document Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Document Status Overview
              </CardTitle>
              <CardDescription>
                Your document submission status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditStatusChart
                data={[
                  { name: "Submitted", value: documents.filter(d => d.status === "submitted").length, color: "#22c55e" },
                  { name: "Pending", value: documents.filter(d => d.status === "pending").length, color: "#f97316" },
                  { name: "Draft", value: documents.filter(d => d.status === "draft").length, color: "#6b7280" },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
                Notification Priority
              </CardTitle>
              <CardDescription>
                Breakdown by priority level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PriorityDistributionChart
                data={[
                  { name: "High", value: notifications.filter(n => n.priority === "high").length, color: "#ef4444" },
                  { name: "Medium", value: notifications.filter(n => n.priority === "medium").length, color: "#f97316" },
                  { name: "Low", value: notifications.filter(n => n.priority === "low").length, color: "#3b82f6" },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Document Requests */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-orange-600" />
                    Document Requests
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Documents pending your action
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push("/client/documents")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingDocs.length > 0 ? (
                  pendingDocs.slice(0, 4).map((doc, index) => (
                    <div 
                      key={doc.id}
                      className="flex items-start justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer animate-in slide-in-from-left"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => router.push("/client/documents")}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">{doc.title}</h4>
                          <Badge className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {doc.description}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due: {new Date(doc.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-blue-600" />
                    Recent Notifications
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Latest updates and alerts
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push("/client/notifications")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.slice(0, 4).map((notification, index) => (
                    <div 
                      key={notification.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer animate-in slide-in-from-right"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => router.push("/client/notifications")}
                    >
                      <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                        notification.priority === 'high' ? 'bg-red-500 animate-pulse' :
                        notification.priority === 'medium' ? 'bg-orange-500' :
                        'bg-blue-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-semibold truncate">{notification.title}</p>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No unread notifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto flex-col items-start p-4 hover:bg-accent hover:border-blue-500 transition-all"
                onClick={() => router.push("/client/documents")}
              >
                <Upload className="h-5 w-5 mb-2 text-blue-600" />
                <span className="font-semibold">Upload Documents</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Submit requested documents
                </span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col items-start p-4 hover:bg-accent hover:border-orange-500 transition-all"
                onClick={() => router.push("/client/documents")}
              >
                <FileText className="h-5 w-5 mb-2 text-orange-600" />
                <span className="font-semibold">View Requests</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Check document requests
                </span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col items-start p-4 hover:bg-accent hover:border-green-500 transition-all"
                onClick={() => router.push("/client/notifications")}
              >
                <Bell className="h-5 w-5 mb-2 text-green-600" />
                <span className="font-semibold">Check Notifications</span>
                <span className="text-xs text-muted-foreground mt-1">
                  View all notifications
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  )
}

