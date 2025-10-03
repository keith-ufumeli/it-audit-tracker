"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLoading } from "@/hooks/use-loading"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/lib/database"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Download,
  Send,
  User,
  Shield
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loader"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { ReportDownloader } from "@/lib/report-downloader"

interface Report {
  id: string
  title: string
  auditId: string
  auditTitle: string
  reportType: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdBy: string
  createdByName: string
  createdAt: string
  submittedAt?: string
  approvedAt?: string
  approvedBy?: string
  content: string
  findings?: string[]
  recommendations?: string[]
}

export default function ReportDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string
  const { isLoading, startLoading, stopLoading } = useLoading()
  const { toast } = useToast()
  const [report, setReport] = useState<Report | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const loadReport = useCallback(async () => {
    startLoading("Loading report details...")
    try {
      const response = await fetch("/api/reports")
      const data = await response.json()
      
      if (data.success) {
        const reportData = data.data.find((r: Report) => r.id === reportId)
        if (!reportData) {
          router.push("/admin/reports")
          return
        }
        setReport(reportData)
      } else {
        router.push("/admin/reports")
      }
    } catch (error) {
      console.error("Error loading report:", error)
      router.push("/admin/reports")
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading, reportId, router])

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

    loadReport()
  }, [session, status, router, reportId, loadReport])

  const handleDownload = async (format: 'pdf' | 'csv' | 'txt') => {
    if (!report) return

    setIsDownloading(true)
    try {
      await ReportDownloader.downloadReport(report, format)
      toast({
        title: "Download Started",
        description: `Report is being downloaded as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Error downloading report:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-600 bg-green-100"
      case "submitted": return "text-blue-600 bg-blue-100"
      case "draft": return "text-gray-600 bg-gray-100"
      case "rejected": return "text-red-600 bg-red-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />
      case "submitted": return <Send className="h-4 w-4" />
      case "draft": return <FileText className="h-4 w-4" />
      case "rejected": return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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

  if (!session || !report) return null

  const canEdit = session.user.id === report.createdBy || 
                  session.user.permissions.includes("approve_reports")

  const audit = Database.getAuditById(report.auditId)
  const creator = Database.getUserById(report.createdBy)
  const approver = report.approvedBy ? Database.getUserById(report.approvedBy) : null

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/reports")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{report.title}</h1>
              <p className="text-muted-foreground mt-1">
                Report ID: {report.id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDownloading}>
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('csv')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Download as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('txt')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Download as Text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canEdit && report.status === 'draft' && (
              <>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-700 hover:bg-blue-200 hover:text-blue-800 hover:border-blue-400">
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </>
            )}
            {canEdit && (
              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-300">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(report.status)}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(report.status)}
              <span>{report.status.toUpperCase()}</span>
            </div>
          </Badge>
          <Badge variant="secondary">
            {report.reportType.toUpperCase()} REPORT
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Associated Audit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-orange-600" />
                  Associated Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {audit ? (
                  <div 
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/audits/${audit.id}`)}
                  >
                    <h3 className="font-semibold mb-2">{audit.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{audit.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()}
                      </span>
                      <Badge className="text-xs">{audit.status}</Badge>
                      <Badge className="text-xs">{audit.priority} priority</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Audit not found</p>
                )}
              </CardContent>
            </Card>

            {/* Report Content */}
            <Card>
              <CardHeader>
                <CardTitle>Report Content</CardTitle>
                <CardDescription>
                  Full report details and findings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {report.content ? (
                  <MarkdownRenderer 
                    content={report.content} 
                    className="prose-lg"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No content has been added to this report yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Findings */}
            {report.findings && report.findings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-orange-600" />
                    Key Findings ({report.findings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {report.findings.map((finding, index) => (
                      <li key={index} className="flex items-start space-x-3 p-3 bg-accent rounded-lg">
                        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-sm">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Recommendations ({report.recommendations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {report.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-600 mt-0.5" />
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Report Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Report Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Prepared By</h4>
                  <div className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{report.createdByName}</p>
                      <p className="text-xs text-muted-foreground">{creator?.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">Created</h4>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(report.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {report.submittedAt && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Submitted</h4>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Send className="h-4 w-4 mr-2" />
                      {new Date(report.submittedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {report.approvedAt && approver && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Approved By</h4>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{approver.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.approvedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {session.user.permissions.includes("approve_reports") && report.status === 'pending' && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-600">Review Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Report
                  </Button>
                  <Button variant="outline" className="w-full text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-300">
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Report
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

