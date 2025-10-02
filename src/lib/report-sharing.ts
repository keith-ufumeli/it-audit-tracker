import { Database } from './database'
import { sendEmailNotification } from './email-simulation'

export interface SharedReport {
  id: string
  reportName: string
  reportType: 'audit' | 'compliance' | 'activity' | 'custom'
  reportData: {
    audits?: any[]
    documents?: any[]
    activities?: any[]
    alerts?: any[]
    summary?: any
  }
  sharedBy: string
  sharedByName: string
  sharedAt: string
  expiresAt?: string
  accessLevel: 'view' | 'download' | 'edit'
  permissions: {
    allowDownload: boolean
    allowPrint: boolean
    allowShare: boolean
    requireAuthentication: boolean
  }
  recipients: {
    userIds: string[]
    emailAddresses: string[]
    publicLink?: string
  }
  metadata: {
    description?: string
    tags?: string[]
    confidential: boolean
    version: string
  }
  status: 'active' | 'expired' | 'revoked'
  viewCount: number
  lastViewed?: string
}

export interface ReportShareLink {
  id: string
  sharedReportId: string
  token: string
  url: string
  expiresAt?: string
  maxUses?: number
  currentUses: number
  createdBy: string
  createdAt: string
  lastUsed?: string
}

export interface ReportComment {
  id: string
  sharedReportId: string
  userId: string
  userName: string
  comment: string
  createdAt: string
  updatedAt?: string
  isResolved: boolean
}

export class ReportSharingManager {
  private static instance: ReportSharingManager
  private sharedReports: SharedReport[] = []
  private shareLinks: ReportShareLink[] = []
  private reportComments: ReportComment[] = []

  private constructor() {
    this.initializeSampleData()
  }

  public static getInstance(): ReportSharingManager {
    if (!ReportSharingManager.instance) {
      ReportSharingManager.instance = new ReportSharingManager()
    }
    return ReportSharingManager.instance
  }

  private initializeSampleData() {
    // Sample shared reports
    this.sharedReports = [
      {
        id: 'share-001',
        reportName: 'Q1 2024 Compliance Report',
        reportType: 'compliance',
        reportData: {
          summary: {
            totalAudits: 15,
            completedAudits: 12,
            complianceRate: 80
          }
        },
        sharedBy: '1',
        sharedByName: 'John Manager',
        sharedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view',
        permissions: {
          allowDownload: true,
          allowPrint: true,
          allowShare: false,
          requireAuthentication: true
        },
        recipients: {
          userIds: ['3'],
          emailAddresses: ['management@audit.com']
        },
        metadata: {
          description: 'Quarterly compliance assessment for Q1 2024',
          tags: ['compliance', 'quarterly', '2024'],
          confidential: true,
          version: '1.0'
        },
        status: 'active',
        viewCount: 5,
        lastViewed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    // Sample share links
    this.shareLinks = [
      {
        id: 'link-001',
        sharedReportId: 'share-001',
        token: 'abc123def456',
        url: 'https://audit-tracker.com/shared/abc123def456',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxUses: 10,
        currentUses: 3,
        createdBy: '1',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }

  public shareReport(
    reportData: any,
    sharedBy: string,
    recipients: { userIds: string[]; emailAddresses: string[] },
    options: {
      reportName: string
      reportType: 'audit' | 'compliance' | 'activity' | 'custom'
      accessLevel: 'view' | 'download' | 'edit'
      permissions: {
        allowDownload: boolean
        allowPrint: boolean
        allowShare: boolean
        requireAuthentication: boolean
      }
      metadata: {
        description?: string
        tags?: string[]
        confidential: boolean
      }
      expiresAt?: string
      createPublicLink?: boolean
    }
  ): SharedReport {
    const sharedReport: SharedReport = {
      id: `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportName: options.reportName,
      reportType: options.reportType,
      reportData,
      sharedBy,
      sharedByName: Database.getUserById(sharedBy)?.name || 'Unknown User',
      sharedAt: new Date().toISOString(),
      expiresAt: options.expiresAt,
      accessLevel: options.accessLevel,
      permissions: options.permissions,
      recipients,
      metadata: {
        ...options.metadata,
        version: '1.0'
      },
      status: 'active',
      viewCount: 0
    }

    this.sharedReports.push(sharedReport)

    // Create public link if requested
    if (options.createPublicLink) {
      this.createShareLink(sharedReport.id, sharedBy)
    }

    // Send notifications to recipients
    this.notifyRecipients(sharedReport)

    // Log activity
    Database.addActivity({
      userId: sharedBy,
      userName: sharedReport.sharedByName,
      userRole: Database.getUserById(sharedBy)?.role || 'unknown',
      action: 'report_shared',
      description: `Shared report: ${options.reportName}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      userAgent: 'Report Sharing System',
      severity: 'info',
      resource: 'report',
      metadata: {
        sharedReportId: sharedReport.id,
        reportType: options.reportType,
        recipientCount: recipients.userIds.length + recipients.emailAddresses.length,
        accessLevel: options.accessLevel
      }
    })

    return sharedReport
  }

  public createShareLink(sharedReportId: string, createdBy: string, options?: {
    expiresAt?: string
    maxUses?: number
  }): ReportShareLink {
    const token = this.generateToken()
    const shareLink: ReportShareLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sharedReportId,
      token,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/${token}`,
      expiresAt: options?.expiresAt,
      maxUses: options?.maxUses,
      currentUses: 0,
      createdBy,
      createdAt: new Date().toISOString()
    }

    this.shareLinks.push(shareLink)

    // Update shared report with public link
    const sharedReport = this.sharedReports.find(r => r.id === sharedReportId)
    if (sharedReport) {
      sharedReport.recipients.publicLink = shareLink.url
    }

    return shareLink
  }

  public getSharedReportByToken(token: string): SharedReport | null {
    const shareLink = this.shareLinks.find(link => link.token === token)
    if (!shareLink) return null

    // Check if link is expired
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return null
    }

    // Check if max uses exceeded
    if (shareLink.maxUses && shareLink.currentUses >= shareLink.maxUses) {
      return null
    }

    const sharedReport = this.sharedReports.find(r => r.id === shareLink.sharedReportId)
    if (!sharedReport || sharedReport.status !== 'active') return null

    // Check if report is expired
    if (sharedReport.expiresAt && new Date(sharedReport.expiresAt) < new Date()) {
      return null
    }

    return sharedReport
  }

  public accessSharedReport(token: string, userId?: string): SharedReport | null {
    const sharedReport = this.getSharedReportByToken(token)
    if (!sharedReport) return null

    // Check authentication requirement
    if (sharedReport.permissions.requireAuthentication && !userId) {
      return null
    }

    // Update access statistics
    sharedReport.viewCount++
    sharedReport.lastViewed = new Date().toISOString()

    const shareLink = this.shareLinks.find(link => link.token === token)
    if (shareLink) {
      shareLink.currentUses++
      shareLink.lastUsed = new Date().toISOString()
    }

    return sharedReport
  }

  public addComment(sharedReportId: string, userId: string, comment: string): ReportComment {
    const reportComment: ReportComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sharedReportId,
      userId,
      userName: Database.getUserById(userId)?.name || 'Unknown User',
      comment,
      createdAt: new Date().toISOString(),
      isResolved: false
    }

    this.reportComments.push(reportComment)

    // Notify report owner
    const sharedReport = this.sharedReports.find(r => r.id === sharedReportId)
    if (sharedReport) {
      Database.addNotification({
        userId: sharedReport.sharedBy,
        userName: sharedReport.sharedByName,
        userRole: Database.getUserById(sharedReport.sharedBy)?.role || 'unknown',
        title: 'New Comment on Shared Report',
        message: `${reportComment.userName} commented on your shared report: "${sharedReport.reportName}"`,
        type: 'system_update',
        priority: 'low',
        metadata: {
          sharedReportId,
          commentId: reportComment.id,
          commenterId: userId
        }
      })
    }

    return reportComment
  }

  public getComments(sharedReportId: string): ReportComment[] {
    return this.reportComments
      .filter(comment => comment.sharedReportId === sharedReportId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  public revokeSharedReport(sharedReportId: string, revokedBy: string): boolean {
    const sharedReport = this.sharedReports.find(r => r.id === sharedReportId)
    if (!sharedReport) return false

    sharedReport.status = 'revoked'

    // Revoke associated share links
    this.shareLinks
      .filter(link => link.sharedReportId === sharedReportId)
      .forEach(link => {
        link.expiresAt = new Date().toISOString() // Expire immediately
      })

    // Log activity
    Database.addActivity({
      userId: revokedBy,
      userName: Database.getUserById(revokedBy)?.name || 'Unknown User',
      userRole: Database.getUserById(revokedBy)?.role || 'unknown',
      action: 'report_access_revoked',
      description: `Revoked access to shared report: ${sharedReport.reportName}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      userAgent: 'Report Sharing System',
      severity: 'warning',
      resource: 'report',
      metadata: {
        sharedReportId,
        reportName: sharedReport.reportName
      }
    })

    return true
  }

  public getSharedReportsByUser(userId: string): SharedReport[] {
    return this.sharedReports.filter(report => report.sharedBy === userId)
  }

  public getSharedReportsForUser(userId: string): SharedReport[] {
    return this.sharedReports.filter(report => 
      report.recipients.userIds.includes(userId) && report.status === 'active'
    )
  }

  public getShareLinksByReport(sharedReportId: string): ReportShareLink[] {
    return this.shareLinks.filter(link => link.sharedReportId === sharedReportId)
  }

  public deleteShareLink(linkId: string): boolean {
    const linkIndex = this.shareLinks.findIndex(link => link.id === linkId)
    if (linkIndex === -1) return false

    this.shareLinks.splice(linkIndex, 1)
    return true
  }

  public getSharingStatistics(): {
    totalSharedReports: number
    activeSharedReports: number
    totalShareLinks: number
    totalViews: number
    totalComments: number
  } {
    return {
      totalSharedReports: this.sharedReports.length,
      activeSharedReports: this.sharedReports.filter(r => r.status === 'active').length,
      totalShareLinks: this.shareLinks.length,
      totalViews: this.sharedReports.reduce((sum, report) => sum + report.viewCount, 0),
      totalComments: this.reportComments.length
    }
  }

  private generateToken(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }

  private async notifyRecipients(sharedReport: SharedReport) {
    const { recipients } = sharedReport

    // Notify user recipients
    recipients.userIds.forEach(userId => {
      const user = Database.getUserById(userId)
      if (user) {
        Database.addNotification({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          title: `Report Shared: ${sharedReport.reportName}`,
          message: `${sharedReport.sharedByName} has shared a report with you.`,
          type: 'report_ready',
          priority: 'medium',
          metadata: {
            sharedReportId: sharedReport.id,
            reportName: sharedReport.reportName,
            reportType: sharedReport.reportType,
            accessLevel: sharedReport.accessLevel
          }
        })
      }
    })

    // Send email notifications
    recipients.emailAddresses.forEach(email => {
      sendEmailNotification({
        to: email,
        subject: `Report Shared: ${sharedReport.reportName}`,
        message: `${sharedReport.sharedByName} has shared a report with you. You can access it through the audit tracker system.`,
        type: 'report_ready',
        metadata: {
          sharedReportId: sharedReport.id,
          reportName: sharedReport.reportName,
          reportType: sharedReport.reportType,
          sharedBy: sharedReport.sharedByName,
          sharedAt: sharedReport.sharedAt
        }
      })
    })
  }
}

export const reportSharingManager = ReportSharingManager.getInstance()
