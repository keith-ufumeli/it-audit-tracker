"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLoading } from "@/hooks/use-loading"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/lib/database"
import { reportGenerator } from "@/lib/report-generator"
import { csvExporter } from "@/lib/csv-exporter"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  Users,
  Shield,
  FileText,
  AlertTriangle,
  Clock,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Share2,
  Send
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loader"

interface ManagementMetrics {
  totalAudits: number
  completedAudits: number
  inProgressAudits: number
  pendingAudits: number
  totalDocuments: number
  pendingDocuments: number
  submittedDocuments: number
  totalAlerts: number
  criticalAlerts: number
  resolvedAlerts: number
  totalActivities: number
  criticalActivities: number
  complianceRate: number
  averageAuditDuration: number
  topAuditors: Array<{ name: string; count: number }>
  riskDistribution: Record<string, number>
  monthlyTrends: Array<{ month: string; audits: number; documents: number; alerts: number }>
}

export default function ManagementDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<ManagementMetrics | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')

  const loadManagementData = useCallback(async () => {
    startLoading("Loading management dashboard...")
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const audits = Database.getAudits()
      const documents = Database.getDocuments()
      const alerts = Database.getAlerts()
      const activities = Database.getActivities()
      // const users = Database.getUsers() // Unused variable

      // Calculate metrics
      const totalAudits = audits.length
      const completedAudits = audits.filter(a => a.status === 'completed').length
      const inProgressAudits = audits.filter(a => a.status === 'in_progress').length
      const pendingAudits = audits.filter(a => a.status === 'planning').length
      
      const totalDocuments = documents.length
      const pendingDocuments = documents.filter(d => d.status === 'pending').length
      const submittedDocuments = documents.filter(d => d.status === 'submitted').length
      
      const totalAlerts = alerts.length
      const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
      const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length
      
      const totalActivities = activities.length
      const criticalActivities = activities.filter(a => a.severity === 'critical').length
      
      const complianceRate = totalAudits > 0 ? (completedAudits / totalAudits) * 100 : 0
      
      // Calculate average audit duration
      const completedAuditsWithDuration = audits.filter(a => 
        a.status === 'completed' && a.startDate && a.endDate
      )
      const averageAuditDuration = completedAuditsWithDuration.length > 0
        ? completedAuditsWithDuration.reduce((sum, audit) => {
            const start = new Date(audit.startDate)
            const end = new Date(audit.endDate)
            return sum + (end.getTime() - start.getTime())
          }, 0) / completedAuditsWithDuration.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0

      // Top auditors
      const auditorActivity = activities.reduce((acc, activity) => {
        if (['audit_manager', 'auditor'].includes(activity.userRole)) {
          acc[activity.userName] = (acc[activity.userName] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
      
      const topAuditors = Object.entries(auditorActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      // Risk distribution
      const riskDistribution = audits.reduce((acc, audit) => {
        acc[audit.priority] = (acc[audit.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Monthly trends (last 6 months)
      const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthAudits = audits.filter(a => {
          const auditDate = new Date(a.createdAt)
          return auditDate >= monthStart && auditDate <= monthEnd
        }).length
        
        const monthDocuments = documents.filter(d => {
          const docDate = new Date(d.requestedAt)
          return docDate >= monthStart && docDate <= monthEnd
        }).length
        
        const monthAlerts = alerts.filter(a => {
          const alertDate = new Date(a.triggeredAt)
          return alertDate >= monthStart && alertDate <= monthEnd
        }).length
        
        return { month, audits: monthAudits, documents: monthDocuments, alerts: monthAlerts }
      }).reverse()

      setMetrics({
        totalAudits,
        completedAudits,
        inProgressAudits,
        pendingAudits,
        totalDocuments,
        pendingDocuments,
        submittedDocuments,
        totalAlerts,
        criticalAlerts,
        resolvedAlerts,
        totalActivities,
        criticalActivities,
        complianceRate,
        averageAuditDuration,
        topAuditors,
        riskDistribution,
        monthlyTrends
      })
    } catch (error) {
      console.error("Error loading management data:", error)
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Only management role can access this page
    if (session.user.role !== "management") {
      router.push("/admin/dashboard")
      return
    }

    loadManagementData()
  }, [session, status, router, loadManagementData])

  const handleExportPDF = async (reportType: string) => {
    try {
      const config = {
        title: `${reportType} Report`,
        subtitle: `Generated for Management - ${new Date().toLocaleDateString()}`,
        includeCharts: true,
        includeDetails: true
      }

      let pdf
      switch (reportType) {
        case 'Audit':
          pdf = reportGenerator.generateAuditReport(config)
          break
        case 'Compliance':
          pdf = reportGenerator.generateComplianceReport(config)
          break
        case 'Activity':
          pdf = reportGenerator.generateActivityReport(config)
          break
        default:
          pdf = reportGenerator.generateAuditReport(config)
      }

      pdf.save(`${reportType.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  const handleExportCSV = async (dataType: string) => {
    try {
      const config = {
        dataType: dataType as 'audits' | 'documents' | 'alerts' | 'activities',
        includeMetadata: true
      }

      let csv
      switch (dataType) {
        case 'audits':
          csv = csvExporter.exportAudits(config)
          break
        case 'documents':
          csv = csvExporter.exportDocuments(config)
          break
        case 'activities':
          csv = csvExporter.exportActivities(config)
          break
        case 'alerts':
          csv = csvExporter.exportAlerts(config)
          break
        case 'compliance':
          csv = csvExporter.exportComplianceSummary(config)
          break
        default:
          csv = csvExporter.exportAudits(config)
      }

      csvExporter.downloadCSV(csv, `${dataType}-export-${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error("Error exporting CSV:", error)
    }
  }

  const handleShareReport = async (reportData: any, reportName: string, reportType: string) => {
    try {
      const response = await fetch("/api/reports/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportData,
          reportName,
          reportType,
          recipients: {
            userIds: ["3"], // Management user
            emailAddresses: ["management@audit.com"]
          },
          accessLevel: "view",
          permissions: {
            allowDownload: true,
            allowPrint: true,
            allowShare: false,
            requireAuthentication: true
          },
          metadata: {
            description: `Shared ${reportType} report from management dashboard`,
            tags: ["management", "dashboard", reportType],
            confidential: true
          },
          createPublicLink: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast({
            title: "Success",
            description: `Report shared successfully! Share link: ${data.data.recipients.publicLink}`,
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to share report",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to share report",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sharing report:", error)
      toast({
        title: "Error",
        description: "Failed to share report. Please try again.",
        variant: "destructive",
      })
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

  if (!session || !metrics) return null

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Management Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Executive overview and strategic insights
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              aria-label="date"
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button 
              onClick={loadManagementData} 
              variant="outline" 
              size="sm"
              className="hover:bg-primary/10 transition-colors"
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {metrics.complianceRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.completedAudits} of {metrics.totalAudits} audits completed
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{metrics.criticalAlerts}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.resolvedAlerts} resolved of {metrics.totalAlerts} total
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Audit Duration</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {metrics.averageAuditDuration.toFixed(1)}d
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Average completion time
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{metrics.pendingDocuments}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.submittedDocuments} submitted of {metrics.totalDocuments} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audits">Audits</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Audit Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Audit Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="text-sm">Completed</span>
                      </div>
                      <span className="font-semibold">{metrics.completedAudits}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span className="text-sm">In Progress</span>
                      </div>
                      <span className="font-semibold">{metrics.inProgressAudits}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-orange-500" />
                        <span className="text-sm">Planning</span>
                      </div>
                      <span className="font-semibold">{metrics.pendingAudits}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Risk Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(metrics.riskDistribution).map(([risk, count]) => (
                      <div key={risk} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`h-3 w-3 rounded-full ${
                            risk === 'critical' ? 'bg-red-500' :
                            risk === 'high' ? 'bg-orange-500' :
                            risk === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          <span className="text-sm capitalize">{risk}</span>
                        </div>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Auditors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Top Performing Auditors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.topAuditors.map((auditor, index) => (
                    <div key={auditor.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold">{index + 1}</span>
                        </div>
                        <span className="font-medium">{auditor.name}</span>
                      </div>
                      <Badge variant="outline">{auditor.count} activities</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audits" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <span className="font-semibold">{metrics.complianceRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Duration</span>
                      <span className="font-semibold">{metrics.averageAuditDuration.toFixed(1)} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Audits</span>
                      <span className="font-semibold">{metrics.totalAudits}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Pending</span>
                      <span className="font-semibold text-orange-600">{metrics.pendingDocuments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Submitted</span>
                      <span className="font-semibold text-green-600">{metrics.submittedDocuments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total</span>
                      <span className="font-semibold">{metrics.totalDocuments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Activities</span>
                      <span className="font-semibold">{metrics.totalActivities}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Critical Events</span>
                      <span className="font-semibold text-red-600">{metrics.criticalActivities}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Security Alerts</span>
                      <span className="font-semibold text-orange-600">{metrics.totalAlerts}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Critical Alerts</span>
                      <Badge variant="destructive">{metrics.criticalAlerts}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resolved Alerts</span>
                      <Badge variant="secondary">{metrics.resolvedAlerts}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Alerts</span>
                      <Badge variant="outline">{metrics.totalAlerts}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Activity Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Activities</span>
                      <span className="font-semibold">{metrics.totalActivities}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Critical Events</span>
                      <span className="font-semibold text-red-600">{metrics.criticalActivities}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Security Events</span>
                      <span className="font-semibold text-orange-600">
                        {metrics.totalActivities - metrics.criticalActivities}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="exports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PDF Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    PDF Reports
                  </CardTitle>
                  <CardDescription>
                    Generate comprehensive reports in PDF format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleExportPDF('Audit')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Audit Report
                    </Button>
                    <Button 
                      onClick={() => handleExportPDF('Compliance')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Compliance Report
                    </Button>
                    <Button 
                      onClick={() => handleExportPDF('Activity')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Activity Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Report Sharing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Share2 className="h-5 w-5 mr-2" />
                    Share Reports
                  </CardTitle>
                  <CardDescription>
                    Share reports with stakeholders and external parties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleShareReport(
                        { summary: metrics, audits: Database.getAudits() },
                        'Executive Dashboard Summary',
                        'audit'
                      )}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Share Executive Summary
                    </Button>
                    <Button 
                      onClick={() => handleShareReport(
                        { summary: metrics, alerts: Database.getAlerts() },
                        'Security Alerts Report',
                        'compliance'
                      )}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Share Security Report
                    </Button>
                    <Button 
                      onClick={() => handleShareReport(
                        { summary: metrics, activities: Database.getActivities() },
                        'Activity Summary Report',
                        'activity'
                      )}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Share Activity Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* CSV Exports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    CSV Exports
                  </CardTitle>
                  <CardDescription>
                    Export data for analysis in spreadsheet applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleExportCSV('audits')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Audits Data
                    </Button>
                    <Button 
                      onClick={() => handleExportCSV('documents')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Documents Data
                    </Button>
                    <Button 
                      onClick={() => handleExportCSV('activities')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Activities Data
                    </Button>
                    <Button 
                      onClick={() => handleExportCSV('compliance')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Compliance Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
