import fs from 'fs'
import path from 'path'

// Database file paths
const DATA_DIR = path.join(process.cwd(), 'src', 'data')
const DB_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  audits: path.join(DATA_DIR, 'audits.json'),
  documents: path.join(DATA_DIR, 'documents.json'),
  activities: path.join(DATA_DIR, 'activities.json'),
  notifications: path.join(DATA_DIR, 'notifications.json'),
} as const

// Types for our database entities
export interface User {
  id: string
  email: string
  name: string
  role: string
  department: string
  permissions: string[]
  createdAt: string
  lastLogin: string
  isActive: boolean
}

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
  type: 'audit_request' | 'document_request' | 'audit_assignment' | 'report_ready' | 'security_alert' | 'system_update'
  status: 'unread' | 'read' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  readAt: string | null
  expiresAt: string
  metadata: Record<string, any>
}

// Generic database operations
export class Database {
  private static readFile<T>(filePath: string): T[] {
    try {
      const data = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error(`Error reading database file ${filePath}:`, error)
      return []
    }
  }

  private static writeFile<T>(filePath: string, data: T[]): boolean {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      return true
    } catch (error) {
      console.error(`Error writing database file ${filePath}:`, error)
      return false
    }
  }

  // User operations
  static getUsers(): User[] {
    return this.readFile<User>(DB_FILES.users)
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
    const users = this.getUsers()
    const index = users.findIndex(user => user.id === id)
    if (index === -1) return false

    users[index] = { ...users[index], ...updates }
    return this.writeFile(DB_FILES.users, users)
  }

  // Audit operations
  static getAudits(): Audit[] {
    return this.readFile<Audit>(DB_FILES.audits)
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

  static updateAudit(id: string, updates: Partial<Audit>): boolean {
    const audits = this.getAudits()
    const index = audits.findIndex(audit => audit.id === id)
    if (index === -1) return false

    audits[index] = { ...audits[index], ...updates, updatedAt: new Date().toISOString() }
    return this.writeFile(DB_FILES.audits, audits)
  }

  // Document operations
  static getDocuments(): Document[] {
    return this.readFile<Document>(DB_FILES.documents)
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
    const documents = this.getDocuments()
    const index = documents.findIndex(doc => doc.id === id)
    if (index === -1) return false

    documents[index] = { ...documents[index], ...updates }
    return this.writeFile(DB_FILES.documents, documents)
  }

  // Activity operations
  static getActivities(): Activity[] {
    return this.readFile<Activity>(DB_FILES.activities)
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
    const activities = this.getActivities()
    const newActivity: Activity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    activities.push(newActivity)
    return this.writeFile(DB_FILES.activities, activities)
  }

  // Notification operations
  static getNotifications(): Notification[] {
    return this.readFile<Notification>(DB_FILES.notifications)
  }

  static getNotificationsByUser(userId: string): Notification[] {
    const notifications = this.getNotifications()
    return notifications.filter(notif => notif.userId === userId)
  }

  static getUnreadNotificationsByUser(userId: string): Notification[] {
    const notifications = this.getNotificationsByUser(userId)
    return notifications.filter(notif => notif.status === 'unread')
  }

  static updateNotification(id: string, updates: Partial<Notification>): boolean {
    const notifications = this.getNotifications()
    const index = notifications.findIndex(notif => notif.id === id)
    if (index === -1) return false

    notifications[index] = { ...notifications[index], ...updates }
    return this.writeFile(DB_FILES.notifications, notifications)
  }

  static addNotification(notification: Omit<Notification, 'id'>): boolean {
    const notifications = this.getNotifications()
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    notifications.push(newNotification)
    return this.writeFile(DB_FILES.notifications, notifications)
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
}
