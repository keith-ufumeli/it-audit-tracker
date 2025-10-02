import jsPDF from 'jspdf'
import { Database, Audit, Document, Activity, Alert } from './database'

export interface ReportConfig {
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

export interface ReportData {
  audits: Audit[]
  documents: Document[]
  activities: Activity[]
  alerts: Alert[]
  summary: {
    totalAudits: number
    completedAudits: number
    pendingDocuments: number
    criticalAlerts: number
    totalActivities: number
  }
}

export class ReportGenerator {
  private doc: jsPDF
  private currentY: number = 20
  private pageHeight: number = 280
  private margin: number = 20

  constructor() {
    this.doc = new jsPDF()
  }

  public generateAuditReport(config: ReportConfig): jsPDF {
    this.doc = new jsPDF()
    this.currentY = 20

    // Get data
    const data = this.getReportData(config)

    // Header
    this.addHeader(config.title, config.subtitle)

    // Executive Summary
    this.addSection('Executive Summary')
    this.addSummaryTable(data.summary)

    // Audit Overview
    this.addSection('Audit Overview')
    this.addAuditTable(data.audits)

    // Document Status
    this.addSection('Document Status')
    this.addDocumentTable(data.documents)

    // Security Alerts
    if (data.alerts.length > 0) {
      this.addSection('Security Alerts')
      this.addAlertTable(data.alerts)
    }

    // Activity Summary
    this.addSection('Activity Summary')
    this.addActivityTable(data.activities.slice(0, 20)) // Limit to 20 most recent

    // Footer
    this.addFooter()

    return this.doc
  }

  public generateComplianceReport(config: ReportConfig): jsPDF {
    this.doc = new jsPDF()
    this.currentY = 20

    const data = this.getReportData(config)

    // Header
    this.addHeader('Compliance Report', config.subtitle)

    // Compliance Overview
    this.addSection('Compliance Overview')
    this.addComplianceSummary(data)

    // Audit Findings
    this.addSection('Audit Findings')
    this.addFindingsTable(data.audits)

    // Risk Assessment
    this.addSection('Risk Assessment')
    this.addRiskAssessment(data)

    // Recommendations
    this.addSection('Recommendations')
    this.addRecommendations(data)

    // Footer
    this.addFooter()

    return this.doc
  }

  public generateActivityReport(config: ReportConfig): jsPDF {
    this.doc = new jsPDF()
    this.currentY = 20

    const data = this.getReportData(config)

    // Header
    this.addHeader('Activity Report', config.subtitle)

    // Activity Summary
    this.addSection('Activity Summary')
    this.addActivitySummary(data.activities)

    // User Activity
    this.addSection('User Activity')
    this.addUserActivityTable(data.activities)

    // Security Events
    this.addSection('Security Events')
    this.addSecurityEventsTable(data.activities.filter(a => a.severity === 'critical' || a.severity === 'error'))

    // Footer
    this.addFooter()

    return this.doc
  }

  private getReportData(config: ReportConfig): ReportData {
    let audits = Database.getAudits()
    let documents = Database.getDocuments()
    let activities = Database.getActivities()
    let alerts = Database.getAlerts()

    // Apply date filters
    if (config.dateRange) {
      const startDate = new Date(config.dateRange.start)
      const endDate = new Date(config.dateRange.end)

      audits = audits.filter(audit => {
        const auditDate = new Date(audit.createdAt)
        return auditDate >= startDate && auditDate <= endDate
      })

      activities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp)
        return activityDate >= startDate && activityDate <= endDate
      })

      alerts = alerts.filter(alert => {
        const alertDate = new Date(alert.triggeredAt)
        return alertDate >= startDate && alertDate <= endDate
      })
    }

    // Apply other filters
    if (config.filters?.status) {
      audits = audits.filter(audit => config.filters!.status!.includes(audit.status))
      documents = documents.filter(doc => config.filters!.status!.includes(doc.status))
    }

    if (config.filters?.severity) {
      activities = activities.filter(activity => config.filters!.severity!.includes(activity.severity))
      alerts = alerts.filter(alert => config.filters!.severity!.includes(alert.severity))
    }

    const summary = {
      totalAudits: audits.length,
      completedAudits: audits.filter(a => a.status === 'completed').length,
      pendingDocuments: documents.filter(d => d.status === 'pending').length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      totalActivities: activities.length
    }

    return { audits, documents, activities, alerts, summary }
  }

  private addHeader(title: string, subtitle?: string) {
    // Company Logo/Title
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Audit Tracker', this.margin, this.currentY)
    this.currentY += 10

    // Report Title
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 8

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(subtitle, this.margin, this.currentY)
      this.currentY += 8
    }

    // Date
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Generated on: ${new Date().toLocaleDateString()}`, this.margin, this.currentY)
    this.currentY += 15

    // Line separator
    this.doc.line(this.margin, this.currentY, 190, this.currentY)
    this.currentY += 10
  }

  private addSection(title: string) {
    if (this.currentY > this.pageHeight) {
      this.doc.addPage()
      this.currentY = 20
    }

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 8

    // Underline
    this.doc.line(this.margin, this.currentY, this.margin + this.doc.getTextWidth(title), this.currentY)
    this.currentY += 10
  }

  private addSummaryTable(summary: ReportData['summary']) {
    const tableData = [
      ['Total Audits', summary.totalAudits.toString()],
      ['Completed Audits', summary.completedAudits.toString()],
      ['Pending Documents', summary.pendingDocuments.toString()],
      ['Critical Alerts', summary.criticalAlerts.toString()],
      ['Total Activities', summary.totalActivities.toString()]
    ]

    this.addTable(tableData, ['Metric', 'Value'])
  }

  private addAuditTable(audits: Audit[]) {
    const tableData = audits.map(audit => [
      audit.title,
      audit.status,
      audit.priority,
      new Date(audit.createdAt).toLocaleDateString(),
      audit.progress.toString() + '%'
    ])

    this.addTable(tableData, ['Title', 'Status', 'Priority', 'Created', 'Progress'])
  }

  private addDocumentTable(documents: Document[]) {
    const tableData = documents.map(doc => [
      doc.title,
      doc.status,
      doc.type,
      new Date(doc.requestedAt).toLocaleDateString(),
      doc.isConfidential ? 'Yes' : 'No'
    ])

    this.addTable(tableData, ['Title', 'Status', 'Type', 'Requested', 'Confidential'])
  }

  private addAlertTable(alerts: Alert[]) {
    const tableData = alerts.map(alert => [
      alert.ruleName,
      alert.severity,
      alert.status,
      alert.triggeredByName,
      new Date(alert.triggeredAt).toLocaleDateString()
    ])

    this.addTable(tableData, ['Rule', 'Severity', 'Status', 'Triggered By', 'Date'])
  }

  private addActivityTable(activities: Activity[]) {
    const tableData = activities.map(activity => [
      activity.action,
      activity.userName,
      activity.severity,
      new Date(activity.timestamp).toLocaleDateString(),
      activity.resource
    ])

    this.addTable(tableData, ['Action', 'User', 'Severity', 'Date', 'Resource'])
  }

  private addComplianceSummary(data: ReportData) {
    const complianceRate = data.summary.totalAudits > 0 
      ? (data.summary.completedAudits / data.summary.totalAudits * 100).toFixed(1)
      : '0'

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Overall Compliance Rate: ${complianceRate}%`, this.margin, this.currentY)
    this.currentY += 8

    this.doc.text(`Total Audits Conducted: ${data.summary.totalAudits}`, this.margin, this.currentY)
    this.currentY += 8

    this.doc.text(`Critical Security Alerts: ${data.summary.criticalAlerts}`, this.margin, this.currentY)
    this.currentY += 15
  }

  private addFindingsTable(audits: Audit[]) {
    const findings = audits.flatMap(audit => audit.findings || [])
    
    if (findings.length === 0) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text('No findings reported.', this.margin, this.currentY)
      this.currentY += 10
      return
    }

    const tableData = findings.map(finding => [
      finding.title,
      finding.severity,
      finding.status,
      finding.assignedTo
    ])

    this.addTable(tableData, ['Finding', 'Severity', 'Status', 'Assigned To'])
  }

  private addRiskAssessment(data: ReportData) {
    const riskLevels = {
      low: data.audits.filter(a => a.priority === 'low').length,
      medium: data.audits.filter(a => a.priority === 'medium').length,
      high: data.audits.filter(a => a.priority === 'high').length,
      critical: data.audits.filter(a => a.priority === 'critical').length
    }

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Risk Distribution:', this.margin, this.currentY)
    this.currentY += 8

    Object.entries(riskLevels).forEach(([level, count]) => {
      this.doc.text(`  ${level.toUpperCase()}: ${count} audits`, this.margin + 10, this.currentY)
      this.currentY += 6
    })

    this.currentY += 10
  }

  private addRecommendations(data: ReportData) {
    const recommendations = [
      'Implement automated security monitoring',
      'Enhance document management procedures',
      'Conduct regular compliance training',
      'Improve audit trail documentation'
    ]

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    recommendations.forEach((rec, index) => {
      this.doc.text(`${index + 1}. ${rec}`, this.margin, this.currentY)
      this.currentY += 8
    })
  }

  private addActivitySummary(activities: Activity[]) {
    const activityCounts = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Top Activities:', this.margin, this.currentY)
    this.currentY += 8

    Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([action, count]) => {
        this.doc.text(`  ${action}: ${count}`, this.margin + 10, this.currentY)
        this.currentY += 6
      })

    this.currentY += 10
  }

  private addUserActivityTable(activities: Activity[]) {
    const userActivity = activities.reduce((acc, activity) => {
      if (!acc[activity.userName]) {
        acc[activity.userName] = { count: 0, lastActivity: activity.timestamp }
      }
      acc[activity.userName].count++
      if (activity.timestamp > acc[activity.userName].lastActivity) {
        acc[activity.userName].lastActivity = activity.timestamp
      }
      return acc
    }, {} as Record<string, { count: number, lastActivity: string }>)

    const tableData = Object.entries(userActivity).map(([user, data]) => [
      user,
      data.count.toString(),
      new Date(data.lastActivity).toLocaleDateString()
    ])

    this.addTable(tableData, ['User', 'Activity Count', 'Last Activity'])
  }

  private addSecurityEventsTable(activities: Activity[]) {
    if (activities.length === 0) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text('No security events recorded.', this.margin, this.currentY)
      this.currentY += 10
      return
    }

    const tableData = activities.map(activity => [
      activity.action,
      activity.userName,
      activity.severity,
      new Date(activity.timestamp).toLocaleDateString(),
      activity.ipAddress
    ])

    this.addTable(tableData, ['Event', 'User', 'Severity', 'Date', 'IP Address'])
  }

  private addTable(data: string[][], headers: string[]) {
    if (this.currentY > this.pageHeight - 50) {
      this.doc.addPage()
      this.currentY = 20
    }

    const colWidths = this.calculateColumnWidths(data, headers)
    const startX = this.margin

    // Headers
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    let currentX = startX

    headers.forEach((header, index) => {
      this.doc.text(header, currentX, this.currentY)
      currentX += colWidths[index]
    })

    this.currentY += 8

    // Data rows
    this.doc.setFont('helvetica', 'normal')
    data.forEach(row => {
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage()
        this.currentY = 20
      }

      currentX = startX
      row.forEach((cell, index) => {
        const cellText = cell.length > 20 ? cell.substring(0, 17) + '...' : cell
        this.doc.text(cellText, currentX, this.currentY)
        currentX += colWidths[index]
      })
      this.currentY += 6
    })

    this.currentY += 10
  }

  private calculateColumnWidths(data: string[][], headers: string[]): number[] {
    const numCols = headers.length
    const availableWidth = 170 // Total width minus margins
    const baseWidth = availableWidth / numCols

    return headers.map(() => baseWidth)
  }

  private addFooter() {
    const pageCount = (this.doc as any).internal.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(
        `Page ${i} of ${pageCount} - Generated by Audit Tracker`,
        20,
        290
      )
    }
  }

  public downloadPDF(filename: string) {
    this.doc.save(filename)
  }

  public getPDFBlob(): Blob {
    return this.doc.output('blob')
  }
}

export const reportGenerator = new ReportGenerator()
