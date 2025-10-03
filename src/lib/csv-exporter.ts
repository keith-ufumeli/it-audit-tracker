import { Database, Audit, Document, Activity, Alert, User } from './database'

export interface ExportConfig {
  dataType: 'audits' | 'documents' | 'activities' | 'alerts' | 'users'
  dateRange?: {
    start: string
    end: string
  }
  filters?: {
    status?: string[]
    severity?: string[]
    userRole?: string[]
  }
  includeMetadata?: boolean
}

export class CSVExporter {
  public exportAudits(config: ExportConfig): string {
    let audits = Database.getAudits()

    // Apply filters
    audits = this.applyFilters(audits, config)

    // Define CSV headers
    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Audit Manager',
      'Assigned Auditors',
      'Start Date',
      'End Date',
      'Created At',
      'Updated At',
      'Progress (%)',
      'Scope',
      'Compliance Frameworks',
      'Findings Count'
    ]

    // Convert data to CSV format
    const rows = audits.map(audit => [
      audit.id,
      audit.title,
      audit.description,
      audit.status,
      audit.priority,
      audit.auditManager,
      audit.assignedAuditors.join('; '),
      audit.startDate,
      audit.endDate,
      audit.createdAt,
      audit.updatedAt,
      audit.progress.toString(),
      audit.scope.join('; '),
      audit.complianceFrameworks.join('; '),
      (audit.findings || []).length.toString()
    ])

    return this.generateCSV(headers, rows)
  }

  public exportDocuments(config: ExportConfig): string {
    let documents = Database.getDocuments()

    // Apply filters
    documents = this.applyFilters(documents, config)

    const headers = [
      'ID',
      'Title',
      'Description',
      'Type',
      'Audit ID',
      'Requested By',
      'Requested From',
      'Status',
      'Uploaded By',
      'Uploaded At',
      'Requested At',
      'Due Date',
      'File Size (bytes)',
      'File Name',
      'Version',
      'Tags',
      'Is Confidential'
    ]

    const rows = documents.map(doc => [
      doc.id,
      doc.title,
      doc.description,
      doc.type,
      doc.auditId,
      doc.requestedBy,
      doc.requestedFrom,
      doc.status,
      doc.uploadedBy || '',
      doc.uploadedAt || '',
      doc.requestedAt,
      doc.dueDate,
      doc.fileSize?.toString() || '',
      doc.fileName || '',
      doc.version || '',
      doc.tags.join('; '),
      doc.isConfidential ? 'Yes' : 'No'
    ])

    return this.generateCSV(headers, rows)
  }

  public exportActivities(config: ExportConfig): string {
    let activities = Database.getActivities()

    // Apply filters
    activities = this.applyFilters(activities, config)

    const headers = [
      'ID',
      'User ID',
      'User Name',
      'User Role',
      'Action',
      'Description',
      'Timestamp',
      'IP Address',
      'User Agent',
      'Severity',
      'Resource',
      'Metadata'
    ]

    const rows = activities.map(activity => [
      activity.id,
      activity.userId,
      activity.userName,
      activity.userRole,
      activity.action,
      activity.description,
      activity.timestamp,
      activity.ipAddress,
      activity.userAgent,
      activity.severity,
      activity.resource,
      config.includeMetadata ? JSON.stringify(activity.metadata) : ''
    ])

    return this.generateCSV(headers, rows)
  }

  public exportAlerts(config: ExportConfig): string {
    let alerts = Database.getAlerts()

    // Apply filters
    alerts = this.applyFilters(alerts, config)

    const headers = [
      'ID',
      'Rule ID',
      'Rule Name',
      'Severity',
      'Description',
      'Triggered By',
      'Triggered By Name',
      'Triggered At',
      'Status',
      'Acknowledged By',
      'Acknowledged At',
      'Resolved By',
      'Resolved At',
      'Metadata'
    ]

    const rows = alerts.map(alert => [
      alert.id,
      alert.ruleId,
      alert.ruleName,
      alert.severity,
      alert.description,
      alert.triggeredBy,
      alert.triggeredByName,
      alert.triggeredAt,
      alert.status,
      alert.acknowledgedBy || '',
      alert.acknowledgedAt || '',
      alert.resolvedBy || '',
      alert.resolvedAt || '',
      config.includeMetadata ? JSON.stringify(alert.metadata) : ''
    ])

    return this.generateCSV(headers, rows)
  }

  public exportUsers(config: ExportConfig): string {
    let users = Database.getUsers()

    // Apply filters
    users = this.applyFilters(users, config)

    const headers = [
      'ID',
      'Email',
      'Name',
      'Role',
      'Department',
      'Permissions',
      'Created At',
      'Last Login',
      'Is Active'
    ]

    const rows = users.map(user => [
      user.id,
      user.email,
      user.name,
      user.role,
      user.department,
      user.permissions.join('; '),
      user.createdAt,
      user.lastLogin || '',
      user.isActive ? 'Yes' : 'No'
    ])

    return this.generateCSV(headers, rows)
  }

  public exportComplianceSummary(config: ExportConfig): string {
    const audits = Database.getAudits()
    const documents = Database.getDocuments()
    const activities = Database.getActivities()
    const alerts = Database.getAlerts()

    const headers = [
      'Metric',
      'Value',
      'Percentage',
      'Last Updated'
    ]

    const totalAudits = audits.length
    const completedAudits = audits.filter(a => a.status === 'completed').length
    const pendingDocuments = documents.filter(d => d.status === 'pending').length
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
    const totalActivities = activities.length

    const rows = [
      ['Total Audits', totalAudits.toString(), '100%', new Date().toISOString()],
      ['Completed Audits', completedAudits.toString(), 
       totalAudits > 0 ? ((completedAudits / totalAudits) * 100).toFixed(1) + '%' : '0%', 
       new Date().toISOString()],
      ['Pending Documents', pendingDocuments.toString(), 
       documents.length > 0 ? ((pendingDocuments / documents.length) * 100).toFixed(1) + '%' : '0%', 
       new Date().toISOString()],
      ['Critical Alerts', criticalAlerts.toString(), 
       alerts.length > 0 ? ((criticalAlerts / alerts.length) * 100).toFixed(1) + '%' : '0%', 
       new Date().toISOString()],
      ['Total Activities', totalActivities.toString(), '100%', new Date().toISOString()]
    ]

    return this.generateCSV(headers, rows)
  }

  public exportAuditFindings(config: ExportConfig): string {
    const audits = Database.getAudits()
    const findings = audits.flatMap(audit => 
      (audit.findings || []).map(finding => ({
        ...finding,
        auditId: audit.id,
        auditTitle: audit.title
      }))
    )

    const headers = [
      'Finding ID',
      'Audit ID',
      'Audit Title',
      'Finding Title',
      'Severity',
      'Status',
      'Description',
      'Recommendation',
      'Assigned To',
      'Due Date',
      'Resolved At'
    ]

    const rows = findings.map(finding => [
      finding.id,
      finding.auditId,
      finding.auditTitle,
      finding.title,
      finding.severity,
      finding.status,
      finding.description,
      finding.recommendation,
      finding.assignedTo,
      finding.dueDate,
      finding.resolvedAt || ''
    ])

    return this.generateCSV(headers, rows)
  }

  private applyFilters<T extends Record<string, any>>(data: T[], config: ExportConfig): T[] {
    let filtered = data

    // Apply date range filter
    if (config.dateRange) {
      const startDate = new Date(config.dateRange.start)
      const endDate = new Date(config.dateRange.end)

      filtered = filtered.filter(item => {
        let dateField: string

        if ('createdAt' in item) {
          dateField = (item as any).createdAt
        } else if ('timestamp' in item) {
          dateField = (item as any).timestamp
        } else if ('triggeredAt' in item) {
          dateField = (item as any).triggeredAt
        } else {
          return true // Skip date filtering if no date field
        }

        const itemDate = new Date(dateField)
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    // Apply status filter
    if (config.filters?.status) {
      filtered = filtered.filter(item => {
        if ('status' in item) {
          return config.filters!.status!.includes(item.status)
        }
        return true
      })
    }

    // Apply severity filter
    if (config.filters?.severity) {
      filtered = filtered.filter(item => {
        if ('severity' in item) {
          return config.filters!.severity!.includes(item.severity)
        }
        return true
      })
    }

    // Apply user role filter
    if (config.filters?.userRole) {
      filtered = filtered.filter(item => {
        if ('userRole' in item) {
          return config.filters!.userRole!.includes(item.userRole)
        }
        return true
      })
    }

    return filtered
  }

  private generateCSV(headers: string[], rows: string[][]): string {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape commas and quotes in cell content
          const escaped = cell.replace(/"/g, '""')
          return `"${escaped}"`
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }

  public downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  public getCSVBlob(csvContent: string): Blob {
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  }
}

export const csvExporter = new CSVExporter()
