import { Database } from './database'
import { reportGenerator } from './report-generator'
import { csvExporter } from './csv-exporter'
import { sendEmailNotification } from './email-simulation'

export interface ScheduledReport {
  id: string
  name: string
  description: string
  reportType: 'audit' | 'compliance' | 'activity' | 'custom'
  exportFormat: 'pdf' | 'csv' | 'both'
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    dayOfWeek?: number // 0-6 for weekly
    dayOfMonth?: number // 1-31 for monthly
    time: string // HH:MM format
    timezone: string
  }
  config: {
    title: string
    subtitle?: string
    includeCharts?: boolean
    includeDetails?: boolean
    dateRange?: {
      start: string
      end: string
    }
    filters?: {
      status?: string[]
      severity?: string[]
      userRole?: string[]
    }
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
  updatedAt: string
}

export interface ReportJob {
  id: string
  scheduledReportId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
  error?: string
  generatedFiles: {
    filename: string
    format: 'pdf' | 'csv'
    size: number
    url?: string
  }[]
  recipients: string[]
}

export class ReportScheduler {
  private static instance: ReportScheduler
  private scheduledReports: ScheduledReport[] = []
  private reportJobs: ReportJob[] = []
  private intervalId: NodeJS.Timeout | null = null

  private constructor() {
    this.initializeDefaultSchedules()
    this.startScheduler()
  }

  public static getInstance(): ReportScheduler {
    if (!ReportScheduler.instance) {
      ReportScheduler.instance = new ReportScheduler()
    }
    return ReportScheduler.instance
  }

  private initializeDefaultSchedules() {
    this.scheduledReports = [
      {
        id: 'schedule-001',
        name: 'Weekly Executive Summary',
        description: 'Weekly summary report for management',
        reportType: 'audit',
        exportFormat: 'pdf',
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 1, // Monday
          time: '09:00',
          timezone: 'UTC'
        },
        config: {
          title: 'Weekly Executive Summary',
          subtitle: 'Automated weekly report for management review',
          includeCharts: true,
          includeDetails: false
        },
        recipients: {
          userIds: ['3'], // Management user
          emailAddresses: ['management@audit.com']
        },
        isActive: true,
        nextRun: this.calculateNextRun('weekly', 1, '09:00'),
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'schedule-002',
        name: 'Monthly Compliance Report',
        description: 'Monthly compliance assessment report',
        reportType: 'compliance',
        exportFormat: 'both',
        schedule: {
          frequency: 'monthly',
          dayOfMonth: 1,
          time: '08:00',
          timezone: 'UTC'
        },
        config: {
          title: 'Monthly Compliance Report',
          subtitle: 'Automated monthly compliance assessment',
          includeCharts: true,
          includeDetails: true
        },
        recipients: {
          userIds: ['1', '2', '3'], // All admin users
          emailAddresses: ['manager@audit.com', 'auditor@audit.com', 'management@audit.com']
        },
        isActive: true,
        nextRun: this.calculateNextRun('monthly', 1, '08:00'),
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'schedule-003',
        name: 'Daily Security Activity',
        description: 'Daily security activity and alert summary',
        reportType: 'activity',
        exportFormat: 'csv',
        schedule: {
          frequency: 'daily',
          time: '18:00',
          timezone: 'UTC'
        },
        config: {
          title: 'Daily Security Activity Report',
          subtitle: 'Automated daily security monitoring report',
          includeCharts: false,
          includeDetails: true,
          filters: {
            severity: ['critical', 'error']
          }
        },
        recipients: {
          userIds: ['1', '2'], // Audit manager and auditor
          emailAddresses: ['manager@audit.com', 'auditor@audit.com']
        },
        isActive: true,
        nextRun: this.calculateNextRun('daily', undefined, '18:00'),
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }

  private startScheduler() {
    // Check every minute for scheduled reports
    this.intervalId = setInterval(() => {
      this.checkScheduledReports()
    }, 60000) // 1 minute
  }

  private checkScheduledReports() {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

    this.scheduledReports
      .filter(report => report.isActive && this.shouldRunReport(report, now, currentTime))
      .forEach(report => {
        this.executeScheduledReport(report)
      })
  }

  private shouldRunReport(report: ScheduledReport, now: Date, currentTime: string): boolean {
    const { schedule } = report

    // Check if it's time to run
    if (currentTime !== schedule.time) {
      return false
    }

    switch (schedule.frequency) {
      case 'daily':
        return true

      case 'weekly':
        return schedule.dayOfWeek !== undefined && now.getDay() === schedule.dayOfWeek

      case 'monthly':
        return schedule.dayOfMonth !== undefined && now.getDate() === schedule.dayOfMonth

      case 'quarterly':
        const month = now.getMonth()
        const quarterMonths = [0, 3, 6, 9] // January, April, July, October
        return schedule.dayOfMonth !== undefined && quarterMonths.includes(month) && now.getDate() === schedule.dayOfMonth

      default:
        return false
    }
  }

  private async executeScheduledReport(scheduledReport: ScheduledReport) {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const job: ReportJob = {
      id: jobId,
      scheduledReportId: scheduledReport.id,
      status: 'running',
      startedAt: new Date().toISOString(),
      generatedFiles: [],
      recipients: [...scheduledReport.recipients.userIds, ...scheduledReport.recipients.emailAddresses]
    }

    this.reportJobs.push(job)

    try {
      // Generate reports based on format
      const files: ReportJob['generatedFiles'] = []

      if (scheduledReport.exportFormat === 'pdf' || scheduledReport.exportFormat === 'both') {
        const pdf = this.generatePDFReport(scheduledReport)
        const pdfOutput = pdf.output('arraybuffer')
        const filename = `${scheduledReport.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
        
        files.push({
          filename,
          format: 'pdf',
          size: pdfOutput.byteLength
        })
      }

      if (scheduledReport.exportFormat === 'csv' || scheduledReport.exportFormat === 'both') {
        const csv = this.generateCSVReport(scheduledReport)
        const csvBlob = csvExporter.getCSVBlob(csv)
        const filename = `${scheduledReport.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
        
        files.push({
          filename,
          format: 'csv',
          size: csvBlob.size
        })
      }

      // Update job with generated files
      job.generatedFiles = files
      job.status = 'completed'
      job.completedAt = new Date().toISOString()

      // Update scheduled report
      scheduledReport.lastRun = new Date().toISOString()
      scheduledReport.nextRun = this.calculateNextRun(
        scheduledReport.schedule.frequency,
        scheduledReport.schedule.dayOfWeek || scheduledReport.schedule.dayOfMonth,
        scheduledReport.schedule.time
      )

      // Send notifications to recipients
      await this.notifyRecipients(scheduledReport, files)

      // Log activity
      Database.addActivity({
        userId: 'system',
        userName: 'System',
        userRole: 'system',
        action: 'scheduled_report_generated',
        description: `Generated scheduled report: ${scheduledReport.name}`,
        ipAddress: '127.0.0.1',
        userAgent: 'Report Scheduler',
        severity: 'info',
        resource: 'report',
        timestamp: new Date().toISOString(),
        metadata: {
          scheduledReportId: scheduledReport.id,
          jobId,
          filesGenerated: files.length,
          recipients: scheduledReport.recipients.userIds.length + scheduledReport.recipients.emailAddresses.length
        }
      })

    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.completedAt = new Date().toISOString()

      console.error('Error executing scheduled report:', error)
    }
  }

  private generatePDFReport(scheduledReport: ScheduledReport) {
    const { config, reportType } = scheduledReport

    switch (reportType) {
      case 'audit':
        return reportGenerator.generateAuditReport(config)
      case 'compliance':
        return reportGenerator.generateComplianceReport(config)
      case 'activity':
        return reportGenerator.generateActivityReport(config)
      default:
        return reportGenerator.generateAuditReport(config)
    }
  }

  private generateCSVReport(scheduledReport: ScheduledReport): string {
    const { config, reportType } = scheduledReport

    const exportConfig = {
      dataType: (reportType === 'audit' ? 'audits' : 
                reportType === 'compliance' ? 'compliance' :
                reportType === 'activity' ? 'activities' : 'audits') as 'audits' | 'documents' | 'activities' | 'alerts' | 'users',
      dateRange: config.dateRange,
      filters: config.filters,
      includeMetadata: config.includeDetails
    }

    switch (reportType) {
      case 'audit':
        return csvExporter.exportAudits(exportConfig)
      case 'compliance':
        return csvExporter.exportComplianceSummary(exportConfig)
      case 'activity':
        return csvExporter.exportActivities(exportConfig)
      default:
        return csvExporter.exportAudits(exportConfig)
    }
  }

  private async notifyRecipients(scheduledReport: ScheduledReport, files: ReportJob['generatedFiles']) {
    const { recipients } = scheduledReport

    // Notify user recipients
    recipients.userIds.forEach(userId => {
      const user = Database.getUserById(userId)
      if (user) {
        Database.addNotification({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          title: `Scheduled Report Generated: ${scheduledReport.name}`,
          message: `Your scheduled report has been generated with ${files.length} file(s).`,
          type: 'report_ready',
          priority: 'medium',
          metadata: {
            scheduledReportId: scheduledReport.id,
            filesCount: files.length,
            files: files.map(f => `${f.filename} (${f.format}, ${f.size} bytes)`).join('; ')
          }
        })
      }
    })

    // Send email notifications
    recipients.emailAddresses.forEach(email => {
      sendEmailNotification({
        to: email,
        subject: `Scheduled Report: ${scheduledReport.name}`,
        message: `Your scheduled report "${scheduledReport.name}" has been generated successfully.`,
        type: 'report_ready',
        metadata: {
          scheduledReportId: scheduledReport.id,
          reportName: scheduledReport.name,
          filesGenerated: files.length,
          generatedAt: new Date().toISOString()
        }
      })
    })
  }

  private calculateNextRun(frequency: string, day?: number, time?: string): string {
    const now = new Date()
    const nextRun = new Date(now)

    switch (frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1)
        break

      case 'weekly':
        if (day !== undefined) {
          const daysUntilNext = (day - now.getDay() + 7) % 7
          nextRun.setDate(now.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext))
        }
        break

      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1)
        if (day !== undefined) {
          nextRun.setDate(day)
        }
        break

      case 'quarterly':
        nextRun.setMonth(now.getMonth() + 3)
        if (day !== undefined) {
          nextRun.setDate(day)
        }
        break
    }

    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      nextRun.setHours(hours, minutes, 0, 0)
    }

    return nextRun.toISOString()
  }

  // Public methods for managing scheduled reports
  public getScheduledReports(): ScheduledReport[] {
    return this.scheduledReports
  }

  public getScheduledReportById(id: string): ScheduledReport | undefined {
    return this.scheduledReports.find(report => report.id === id)
  }

  public createScheduledReport(report: Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt' | 'nextRun'>): ScheduledReport {
    const newReport: ScheduledReport = {
      ...report,
      id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nextRun: this.calculateNextRun(
        report.schedule.frequency,
        report.schedule.dayOfWeek || report.schedule.dayOfMonth,
        report.schedule.time
      ),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.scheduledReports.push(newReport)
    return newReport
  }

  public updateScheduledReport(id: string, updates: Partial<ScheduledReport>): boolean {
    const reportIndex = this.scheduledReports.findIndex(report => report.id === id)
    if (reportIndex === -1) return false

    this.scheduledReports[reportIndex] = {
      ...this.scheduledReports[reportIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return true
  }

  public deleteScheduledReport(id: string): boolean {
    const reportIndex = this.scheduledReports.findIndex(report => report.id === id)
    if (reportIndex === -1) return false

    this.scheduledReports.splice(reportIndex, 1)
    return true
  }

  public getReportJobs(): ReportJob[] {
    return this.reportJobs
  }

  public getReportJobById(id: string): ReportJob | undefined {
    return this.reportJobs.find(job => job.id === id)
  }

  public getReportJobsByScheduledReport(scheduledReportId: string): ReportJob[] {
    return this.reportJobs.filter(job => job.scheduledReportId === scheduledReportId)
  }

  public stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

export const reportScheduler = ReportScheduler.getInstance()
