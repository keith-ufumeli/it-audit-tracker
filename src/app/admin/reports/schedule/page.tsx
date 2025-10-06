"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useLoading } from "@/hooks/use-loading"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  Calendar,
  Clock,
  Download,
  Play,
  Pause,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"

interface ScheduledReport {
  id: string
  name: string
  description: string
  reportType: string
  exportFormat: string
  schedule: {
    frequency: string
    dayOfWeek?: number
    dayOfMonth?: number
    time: string
    timezone: string
  }
  recipients: {
    userIds: string[]
    emailAddresses: string[]
  }
  isActive: boolean
  lastRun?: string
  nextRun: string
  createdBy: string
  createdAt: string
}

interface ReportJob {
  id: string
  scheduledReportId: string
  status: string
  startedAt?: string
  completedAt?: string
  error?: string
  generatedFiles: {
    filename: string
    format: string
    size: number
  }[]
}

export default function ReportSchedulePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [reportJobs, setReportJobs] = useState<ReportJob[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)
  const [newReport, setNewReport] = useState({
    name: "",
    description: "",
    reportType: "audit",
    exportFormat: "pdf",
    frequency: "weekly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: "09:00",
    timezone: "UTC",
    recipients: {
      userIds: [],
      emailAddresses: []
    }
  })

  const loadScheduledReports = useCallback(async () => {
    startLoading("Loading scheduled reports...")
    try {
      const response = await fetch("/api/reports/schedule")
      const data = await response.json()

      if (data.success) {
        setScheduledReports(data.data.scheduledReports)
        setReportJobs(data.data.reportJobs)
      }
    } catch (error) {
      console.error("Error loading scheduled reports:", error)
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

    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      router.push("/client")
      return
    }

    loadScheduledReports()
  }, [session, status, router, loadScheduledReports])

  const handleCreateReport = async () => {
    try {
      const response = await fetch("/api/reports/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newReport.name,
          description: newReport.description,
          reportType: newReport.reportType,
          exportFormat: newReport.exportFormat,
          schedule: {
            frequency: newReport.frequency,
            dayOfWeek: newReport.frequency === "weekly" ? newReport.dayOfWeek : undefined,
            dayOfMonth: newReport.frequency === "monthly" ? newReport.dayOfMonth : undefined,
            time: newReport.time,
            timezone: newReport.timezone
          },
          config: {
            title: newReport.name,
            includeCharts: true,
            includeDetails: true
          },
          recipients: newReport.recipients
        })
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        setNewReport({
          name: "",
          description: "",
          reportType: "audit",
          exportFormat: "pdf",
          frequency: "weekly",
          dayOfWeek: 1,
          dayOfMonth: 1,
          time: "09:00",
          timezone: "UTC",
          recipients: {
            userIds: [],
            emailAddresses: []
          }
        })
        loadScheduledReports()
      }
    } catch (error) {
      console.error("Error creating scheduled report:", error)
    }
  }

  const handleToggleReport = async (reportId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/reports/schedule", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: reportId,
          updates: { isActive: !isActive }
        })
      })

      if (response.ok) {
        loadScheduledReports()
      }
    } catch (error) {
      console.error("Error toggling report:", error)
    }
  }

  const handleDeleteReport = async () => {
    if (!reportToDelete) return
    
    try {
      const response = await fetch(`/api/reports/schedule?id=${reportToDelete}`, {
        method: "DELETE"
      })

      if (response.ok) {
        loadScheduledReports()
        setIsDeleteDialogOpen(false)
        setReportToDelete(null)
      }
    } catch (error) {
      console.error("Error deleting report:", error)
    }
  }

  const openDeleteDialog = (reportId: string) => {
    setReportToDelete(reportId)
    setIsDeleteDialogOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'running': return <Clock className="h-4 w-4 text-blue-600" />
      default: return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getFrequencyLabel = (frequency: string, dayOfWeek?: number, dayOfMonth?: number) => {
    switch (frequency) {
      case 'daily': return 'Daily'
      case 'weekly': return `Weekly (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek || 0]})`
      case 'monthly': return `Monthly (Day ${dayOfMonth})`
      case 'quarterly': return `Quarterly (Day ${dayOfMonth})`
      default: return frequency
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in duration-500 px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Report Scheduling</h1>
            <p className="text-muted-foreground">
              Manage automated report generation and distribution
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Report</DialogTitle>
                <DialogDescription>
                  Create a new automated report schedule
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Report Name</Label>
                    <Input
                      id="name"
                      value={newReport.name}
                      onChange={(e) => setNewReport({...newReport, name: e.target.value})}
                      placeholder="Enter report name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportType">Report Type</Label>
                    <select
                      id="reportType"
                      aria-label="report-type"
                      value={newReport.reportType}
                      onChange={(e) => setNewReport({...newReport, reportType: e.target.value})}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="audit">Audit Report</option>
                      <option value="compliance">Compliance Report</option>
                      <option value="activity">Activity Report</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newReport.description}
                    onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                    placeholder="Enter report description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exportFormat">Export Format</Label>
                    <select
                      id="exportFormat"
                      aria-label="export-format"
                      value={newReport.exportFormat}
                      onChange={(e) => setNewReport({...newReport, exportFormat: e.target.value})}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="pdf">PDF</option>
                      <option value="csv">CSV</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <select
                      id="frequency"
                      aria-label="frequency"
                      value={newReport.frequency}
                      onChange={(e) => setNewReport({...newReport, frequency: e.target.value})}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newReport.time}
                      onChange={(e) => setNewReport({...newReport, time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      aria-label="timezone"
                      value={newReport.timezone}
                      onChange={(e) => setNewReport({...newReport, timezone: e.target.value})}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReport}>
                    Create Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Scheduled Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {scheduledReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      {report.name}
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={report.isActive ? "default" : "secondary"}>
                      {report.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleReport(report.id, report.isActive)}
                    >
                      {report.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDeleteDialog(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{report.reportType}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Format:</span>
                    <span className="uppercase">{report.exportFormat}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Schedule:</span>
                    <span>{getFrequencyLabel(report.schedule.frequency, report.schedule.dayOfWeek, report.schedule.dayOfMonth)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Time:</span>
                    <span>{report.schedule.time} {report.schedule.timezone}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next Run:</span>
                    <span>{formatDateTime(report.nextRun)}</span>
                  </div>
                  {report.lastRun && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Run:</span>
                      <span>{formatDateTime(report.lastRun)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Recipients:</span>
                    <span>{report.recipients.userIds.length + report.recipients.emailAddresses.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Report Jobs</CardTitle>
            <CardDescription>
              Latest automated report generation jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportJobs.slice(0, 10).map((job) => {
                const report = scheduledReports.find(r => r.id === job.scheduledReportId)
                return (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-semibold">{report?.name || 'Unknown Report'}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.startedAt && formatDateTime(job.startedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                        {job.status}
                      </Badge>
                      {job.generatedFiles.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Download className="h-4 w-4" />
                          <span>{job.generatedFiles.length} files</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {reportJobs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No report jobs yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scheduled Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scheduled report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteReport}
            >
              Yes, Delete Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
