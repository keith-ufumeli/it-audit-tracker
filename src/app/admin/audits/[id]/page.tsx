"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLoading } from "@/hooks/use-loading"
import { Database, Audit } from "@/lib/database"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Edit,
  Trash2,
  UserPlus,
  TrendingUp,
  Target,
  Activity
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loader"

export default function AuditDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const auditId = params.id as string
  const { isLoading, startLoading, stopLoading } = useLoading()
  const [audit, setAudit] = useState<Audit | null>(null)

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

    loadAudit()
  }, [session, status, router, auditId])

  const loadAudit = async () => {
    startLoading("Loading audit details...")
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const auditData = Database.getAuditById(auditId)
      if (!auditData) {
        router.push("/admin/audits")
        return
      }
      setAudit(auditData)
    } catch (error) {
      console.error("Error loading audit:", error)
      router.push("/admin/audits")
    } finally {
      stopLoading()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100"
      case "in_progress": return "text-blue-600 bg-blue-100"
      case "planning": return "text-purple-600 bg-purple-100"
      case "cancelled": return "text-gray-600 bg-gray-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600 bg-red-100"
      case "high": return "text-orange-600 bg-orange-100"
      case "medium": return "text-yellow-600 bg-yellow-100"
      case "low": return "text-green-600 bg-green-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-100"
      case "high": return "text-orange-600 bg-orange-100"
      case "medium": return "text-yellow-600 bg-yellow-100"
      case "low": return "text-blue-600 bg-blue-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CardSkeleton />
            </div>
            <CardSkeleton />
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!session || !audit) return null

  const canEdit = session.user.permissions.includes("create_audit") || 
                  session.user.id === audit.auditManager

  // Get user details for audit manager and auditors
  const auditManager = Database.getUserById(audit.auditManager)
  const auditors = audit.assignedAuditors.map(id => Database.getUserById(id)).filter(Boolean)

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/audits")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audits
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{audit.title}</h1>
              <p className="text-muted-foreground mt-1">
                Audit ID: {audit.id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Audit
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(audit.status)}>
            {audit.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge className={getPriorityColor(audit.priority)}>
            {audit.priority.toUpperCase()} PRIORITY
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Overview</CardTitle>
                <CardDescription>
                  Detailed information about this audit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{audit.description}</p>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Progress
                    </h3>
                    <span className="text-2xl font-bold text-orange-600">{audit.progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                      style={{ width: `${audit.progress}%` }}
                    />
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      Start Date
                    </h3>
                    <p className="text-muted-foreground">
                      {new Date(audit.startDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      End Date
                    </h3>
                    <p className="text-muted-foreground">
                      {new Date(audit.endDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Scope */}
                {audit.scope && audit.scope.length > 0 && (
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <Target className="h-4 w-4 mr-2" />
                      Audit Scope
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {audit.scope.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance Frameworks */}
                {audit.complianceFrameworks && audit.complianceFrameworks.length > 0 && (
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <Shield className="h-4 w-4 mr-2" />
                      Compliance Frameworks
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {audit.complianceFrameworks.map((framework, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Findings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                      Audit Findings
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Issues and observations from this audit
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <Button size="sm" variant="outline">
                      Add Finding
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {audit.findings && audit.findings.length > 0 ? (
                  <div className="space-y-4">
                    {audit.findings.map((finding, index) => (
                      <div 
                        key={finding.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{finding.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {finding.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge className={getSeverityColor(finding.severity)}>
                              {finding.severity}
                            </Badge>
                            <Badge variant="outline">
                              {finding.status}
                            </Badge>
                          </div>
                        </div>
                        {finding.recommendation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">Recommendation:</p>
                            <p className="text-sm text-blue-800 mt-1">{finding.recommendation}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>Due: {new Date(finding.dueDate).toLocaleDateString()}</span>
                          {finding.resolvedAt && (
                            <span className="text-green-600">
                              Resolved: {new Date(finding.resolvedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No findings have been recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Audit Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Audit Manager</h4>
                  <div className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">
                        {auditManager?.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{auditManager?.name}</p>
                      <p className="text-xs text-muted-foreground">{auditManager?.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">Assigned Auditors</h4>
                    {canEdit && (
                      <Button size="sm" variant="ghost">
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {auditors.length > 0 ? (
                    <div className="space-y-2">
                      {auditors.map((auditor) => (
                        <div key={auditor?.id} className="flex items-center space-x-3 p-2 hover:bg-accent rounded-lg transition-colors">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-semibold">
                              {auditor?.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{auditor?.name}</p>
                            <p className="text-xs text-muted-foreground">{auditor?.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No auditors assigned
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Findings</span>
                  <span className="text-xl font-bold">{audit.findings?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Open Findings</span>
                  <span className="text-xl font-bold text-red-600">
                    {audit.findings?.filter(f => f.status === 'open').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resolved</span>
                  <span className="text-xl font-bold text-green-600">
                    {audit.findings?.filter(f => f.status === 'resolved').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Team Size</span>
                  <span className="text-xl font-bold">
                    {audit.assignedAuditors.length + 1}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Audit Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(audit.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

