// Note: Direct JSON imports removed to prevent Turbopack HMR caching issues
// Data is now loaded dynamically via API endpoints

// Types for our database entities
// User interface moved to @/types/user.ts to avoid Edge Runtime issues
import type { User } from "@/types/user"
export type { User }

export interface Audit {
  id: string
  title: string
  description: string
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  auditManager: string
  assignedAuditors: string[]
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  scope: string[]
  complianceFrameworks: string[]
  findings: AuditFinding[]
  progress: number
}

export interface AuditFinding {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  description: string
  recommendation: string
  assignedTo: string
  dueDate: string
  resolvedAt?: string
}

export interface Document {
  id: string
  title: string
  description: string
  type: 'policy' | 'procedure' | 'log' | 'plan' | 'report' | 'evidence'
  auditId: string
  requestedBy: string
  requestedFrom: string
  status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected'
  uploadedBy?: string
  uploadedAt?: string
  requestedAt: string
  dueDate: string
  fileSize?: number
  fileName?: string
  filePath?: string
  version?: string
  tags: string[]
  isConfidential: boolean
}

export interface Activity {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  description: string
  timestamp: string
  ipAddress: string
  userAgent: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  resource: string
  metadata: Record<string, any>
}

export interface Notification {
  id: string
  userId: string
  userName: string
  userRole: string
  title: string
  message: string
  type: 'audit_request' | 'document_request' | 'document_upload' | 'audit_assignment' | 'report_ready' | 'security_alert' | 'system_update'
  status: 'unread' | 'read' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  readAt: string | null
  expiresAt?: string
  metadata?: Record<string, any>
}

export interface Alert {
  id: string
  ruleId: string
  ruleName: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  description: string
  triggeredBy: string
  triggeredByName: string
  triggeredAt: string
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolvedBy?: string
  resolvedAt?: string
  metadata?: Record<string, any>
}

export interface Report {
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

// Import user data directly for Edge Runtime compatibility
import usersData from '../data/users.json'
import auditsData from '../data/audits.json'
import documentsData from '../data/documents.json'
import activitiesData from '../data/activities.json'
import notificationsData from '../data/notifications.json'
import reportsData from '../data/reports.json'

// In-memory data storage (Edge Runtime compatible)
export class InMemoryDatabase {
  static users: User[] = usersData as User[]
  static audits: Audit[] = auditsData as Audit[]
  static documents: Document[] = documentsData as Document[]
  static activities: Activity[] = activitiesData as Activity[]
  static notifications: Notification[] = notificationsData as Notification[]
  static reports: Report[] = reportsData as Report[]
  static alerts: Alert[] = [
    {
      id: 'alert-001',
      ruleId: 'rule-001',
      ruleName: 'Multiple Failed Login Attempts',
      severity: 'error',
      description: 'User has attempted to login 5 times in the last 15 minutes',
      triggeredBy: '2',
      triggeredByName: 'Jane Auditor',
      triggeredAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      status: 'active',
      metadata: {
        attemptCount: 5,
        timeWindow: '15 minutes',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    },
    {
      id: 'alert-002',
      ruleId: 'rule-002',
      ruleName: 'Suspicious Document Access',
      severity: 'warning',
      description: 'User has accessed 8 confidential documents in the last 30 minutes',
      triggeredBy: '4',
      triggeredByName: 'Client User',
      triggeredAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
      status: 'acknowledged',
      acknowledgedBy: '1',
      acknowledgedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      metadata: {
        documentCount: 8,
        timeWindow: '30 minutes',
        documentTypes: ['financial', 'confidential', 'legal'],
        accessPattern: 'unusual'
      }
    },
    {
      id: 'alert-003',
      ruleId: 'rule-003',
      ruleName: 'Admin Privilege Escalation',
      severity: 'critical',
      description: 'Non-admin user attempted to access admin dashboard',
      triggeredBy: '5',
      triggeredByName: 'Department User',
      triggeredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      status: 'active',
      metadata: {
        attemptedAction: 'admin_dashboard_access',
        userRole: 'department',
        requestedResource: '/admin/dashboard',
        ipAddress: '192.168.1.150'
      }
    },
    {
      id: 'alert-004',
      ruleId: 'rule-004',
      ruleName: 'Unusual Activity Pattern',
      severity: 'warning',
      description: 'User has performed 25 actions in the last hour',
      triggeredBy: '3',
      triggeredByName: 'Management User',
      triggeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      status: 'resolved',
      resolvedBy: '1',
      resolvedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      metadata: {
        actionCount: 25,
        timeWindow: '1 hour',
        actionTypes: ['view', 'download', 'search'],
        isNormal: true
      }
    },
    {
      id: 'alert-005',
      ruleId: 'rule-001',
      ruleName: 'Multiple Failed Login Attempts',
      severity: 'error',
      description: 'User has attempted to login 4 times in the last 10 minutes',
      triggeredBy: '6',
      triggeredByName: 'External User',
      triggeredAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      status: 'active',
      metadata: {
        attemptCount: 4,
        timeWindow: '10 minutes',
        ipAddress: '203.0.113.45',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        isExternal: true
      }
    },
    {
      id: 'alert-006',
      ruleId: 'rule-002',
      ruleName: 'Suspicious Document Access',
      severity: 'critical',
      description: 'User has accessed 12 highly confidential documents in the last 20 minutes',
      triggeredBy: '7',
      triggeredByName: 'Unknown User',
      triggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      status: 'active',
      metadata: {
        documentCount: 12,
        timeWindow: '20 minutes',
        documentTypes: ['highly_confidential', 'restricted', 'classified'],
        accessPattern: 'suspicious',
        riskLevel: 'high'
      }
    },
    {
      id: 'alert-007',
      ruleId: 'rule-003',
      ruleName: 'Admin Privilege Escalation',
      severity: 'critical',
      description: 'Client user attempted to modify audit settings',
      triggeredBy: '8',
      triggeredByName: 'Client Admin',
      triggeredAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
      status: 'acknowledged',
      acknowledgedBy: '2',
      acknowledgedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      metadata: {
        attemptedAction: 'modify_audit_settings',
        userRole: 'client',
        requestedResource: '/admin/audits/settings',
        ipAddress: '192.168.1.200',
        severity: 'high'
      }
    },
    {
      id: 'alert-008',
      ruleId: 'rule-004',
      ruleName: 'Unusual Activity Pattern',
      severity: 'info',
      description: 'User has performed 15 actions in the last 30 minutes',
      triggeredBy: '1',
      triggeredByName: 'John Manager',
      triggeredAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
      status: 'dismissed',
      metadata: {
        actionCount: 15,
        timeWindow: '30 minutes',
        actionTypes: ['view', 'export', 'generate_report'],
        isNormal: true,
        dismissedReason: 'Normal business activity'
      }
    }
  ]

  // Note: In Edge Runtime, we can't write to files
  // This is a read-only implementation for demo purposes
  // In production, you would use a real database or API calls

  // Method to reload data from files (for development)
  static reloadFromFiles() {
    // This would require file system access which is not available in Edge Runtime
    // In a real implementation, you would reload from the actual data source
    console.log('Data reload requested - in production this would reload from database')
  }

  // Method to load data from files (called by API routes)
  static async loadDataFromFiles() {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const dataDir = path.join(process.cwd(), 'src', 'data')
      
      // Load users
      const usersData = await fs.readFile(path.join(dataDir, 'users.json'), 'utf8')
      this.users = JSON.parse(usersData)
      
      // Load audits
      const auditsData = await fs.readFile(path.join(dataDir, 'audits.json'), 'utf8')
      this.audits = JSON.parse(auditsData)
      
      // Load documents
      const documentsData = await fs.readFile(path.join(dataDir, 'documents.json'), 'utf8')
      this.documents = JSON.parse(documentsData)
      
      // Load activities
      const activitiesData = await fs.readFile(path.join(dataDir, 'activities.json'), 'utf8')
      this.activities = JSON.parse(activitiesData)
      
      // Load notifications
      const notificationsData = await fs.readFile(path.join(dataDir, 'notifications.json'), 'utf8')
      this.notifications = JSON.parse(notificationsData)
      
      // Load reports
      const reportsData = await fs.readFile(path.join(dataDir, 'reports.json'), 'utf8')
      this.reports = JSON.parse(reportsData)
      
      console.log('✅ Data loaded from files into in-memory database')
    } catch (error) {
      console.error('❌ Error loading data from files:', error)
    }
  }
}

// Generic database operations (Edge Runtime compatible)
export class Database {
  // User operations
  static getUsers(): User[] {
    return [...InMemoryDatabase.users]
  }

  static getUserById(id: string): User | null {
    const users = this.getUsers()
    return users.find(user => user.id === id) || null
  }

  static getUserByEmail(email: string): User | null {
    const users = this.getUsers()
    return users.find(user => user.email === email) || null
  }

  static updateUser(id: string, updates: Partial<User>): boolean {
    const index = InMemoryDatabase.users.findIndex(user => user.id === id)
    if (index === -1) return false

    // Update in-memory data
    InMemoryDatabase.users[index] = { ...InMemoryDatabase.users[index], ...updates }
    return true
  }

  // Audit operations
  static getAudits(): Audit[] {
    return [...InMemoryDatabase.audits]
  }

  static getAuditById(id: string): Audit | null {
    const audits = this.getAudits()
    return audits.find(audit => audit.id === id) || null
  }

  static getAuditsByManager(managerId: string): Audit[] {
    const audits = this.getAudits()
    return audits.filter(audit => audit.auditManager === managerId)
  }

  static getAuditsByAuditor(auditorId: string): Audit[] {
    const audits = this.getAudits()
    return audits.filter(audit => audit.assignedAuditors.includes(auditorId))
  }

  static addAudit(audit: Audit): boolean {
    try {
      InMemoryDatabase.audits.push(audit)
      return true
    } catch (error) {
      console.error("Error adding audit:", error)
      return false
    }
  }

  static updateAudit(id: string, updates: Partial<Audit>): boolean {
    const index = InMemoryDatabase.audits.findIndex(audit => audit.id === id)
    if (index === -1) return false

    // Update in-memory data
    InMemoryDatabase.audits[index] = { ...InMemoryDatabase.audits[index], ...updates, updatedAt: new Date().toISOString() }
    return true
  }

  // Document operations
  static getDocuments(): Document[] {
    return [...InMemoryDatabase.documents]
  }

  static getDocumentById(id: string): Document | null {
    const documents = this.getDocuments()
    return documents.find(doc => doc.id === id) || null
  }

  static getDocumentsByAudit(auditId: string): Document[] {
    const documents = this.getDocuments()
    return documents.filter(doc => doc.auditId === auditId)
  }

  static getDocumentsByUser(userId: string): Document[] {
    const documents = this.getDocuments()
    return documents.filter(doc => doc.requestedBy === userId || doc.requestedFrom === userId)
  }

  static updateDocument(id: string, updates: Partial<Document>): boolean {
    const index = InMemoryDatabase.documents.findIndex(doc => doc.id === id)
    if (index === -1) return false

    // Update in-memory data
    InMemoryDatabase.documents[index] = { ...InMemoryDatabase.documents[index], ...updates }
    return true
  }

  // Activity operations
  static getActivities(): Activity[] {
    return [...InMemoryDatabase.activities]
  }

  static getActivitiesByUser(userId: string): Activity[] {
    const activities = this.getActivities()
    return activities.filter(activity => activity.userId === userId)
  }

  static getRecentActivities(limit: number = 50): Activity[] {
    const activities = this.getActivities()
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  static addActivity(activity: Omit<Activity, 'id'>): boolean {
    const newActivity: Activity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    // Add to in-memory data
    InMemoryDatabase.activities.push(newActivity)
    return true
  }

  // Notification operations
  static getNotifications(): Notification[] {
    return [...InMemoryDatabase.notifications]
  }

  static getNotificationsByUser(userId: string): Notification[] {
    const notifications = this.getNotifications()
    return notifications.filter(notif => notif.userId === userId)
  }

  static getUnreadNotificationsByUser(userId: string): Notification[] {
    const notifications = this.getNotificationsByUser(userId)
    return notifications.filter(notif => notif.status === 'unread')
  }

  // Alert management methods
  static getAlerts(): Alert[] {
    return InMemoryDatabase.alerts
  }

  static getActiveAlerts(): Alert[] {
    return InMemoryDatabase.alerts.filter(alert => alert.status === 'active')
  }

  static getAlertsBySeverity(severity: string): Alert[] {
    return InMemoryDatabase.alerts.filter(alert => alert.severity === severity)
  }

  static addAlert(alert: Alert): boolean {
    InMemoryDatabase.alerts.push(alert)
    return true
  }

  static updateAlert(alertId: string, updates: Partial<Alert>): boolean {
    const alertIndex = InMemoryDatabase.alerts.findIndex(alert => alert.id === alertId)
    if (alertIndex === -1) return false

    InMemoryDatabase.alerts[alertIndex] = { ...InMemoryDatabase.alerts[alertIndex], ...updates }
    return true
  }

  static acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    return this.updateAlert(alertId, {
      status: 'acknowledged',
      acknowledgedBy,
      acknowledgedAt: new Date().toISOString()
    })
  }

  static resolveAlert(alertId: string, resolvedBy: string): boolean {
    return this.updateAlert(alertId, {
      status: 'resolved',
      resolvedBy,
      resolvedAt: new Date().toISOString()
    })
  }

  static dismissAlert(alertId: string): boolean {
    return this.updateAlert(alertId, {
      status: 'dismissed'
    })
  }

  static updateNotification(id: string, updates: Partial<Notification>): boolean {
    const index = InMemoryDatabase.notifications.findIndex(notif => notif.id === id)
    if (index === -1) return false

    // Update in-memory data
    InMemoryDatabase.notifications[index] = { ...InMemoryDatabase.notifications[index], ...updates }
    return true
  }

  static addNotification(notification: Omit<Notification, 'id' | 'status' | 'createdAt' | 'readAt'>): boolean {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "unread",
      createdAt: new Date().toISOString(),
      readAt: null
    }
    // Add to in-memory data
    InMemoryDatabase.notifications.push(newNotification)
    return true
  }

  // Utility methods
  static getStats() {
    const users = this.getUsers()
    const audits = this.getAudits()
    const documents = this.getDocuments()
    const activities = this.getActivities()
    const notifications = this.getNotifications()

    return {
      users: {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        byRole: users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      audits: {
        total: audits.length,
        byStatus: audits.reduce((acc, audit) => {
          acc[audit.status] = (acc[audit.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      documents: {
        total: documents.length,
        byStatus: documents.reduce((acc, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      activities: {
        total: activities.length,
        recent: activities.filter(a => {
          const activityDate = new Date(a.timestamp)
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          return activityDate > oneDayAgo
        }).length
      },
      notifications: {
        total: notifications.length,
        unread: notifications.filter(n => n.status === 'unread').length
      }
    }
  }

  // Report operations
  static getReports(): Report[] {
    return InMemoryDatabase.reports
  }

  static getReportById(id: string): Report | undefined {
    return InMemoryDatabase.reports.find(report => report.id === id)
  }

  static getReportsByAuditId(auditId: string): Report[] {
    return InMemoryDatabase.reports.filter(report => report.auditId === auditId)
  }

  static addReport(report: Report): void {
    InMemoryDatabase.reports.push(report)
  }

  static updateReport(id: string, updates: Partial<Report>): boolean {
    const index = InMemoryDatabase.reports.findIndex(report => report.id === id)
    if (index === -1) return false

    InMemoryDatabase.reports[index] = { ...InMemoryDatabase.reports[index], ...updates }
    return true
  }

  static deleteReport(id: string): boolean {
    const index = InMemoryDatabase.reports.findIndex(report => report.id === id)
    if (index === -1) return false

    InMemoryDatabase.reports.splice(index, 1)
    return true
  }
}
