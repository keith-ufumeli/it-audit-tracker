/**
 * File-based Database Service
 * This service provides actual file persistence for JSON data
 * Replaces the InMemory database with real file operations
 * 
 * NOTE: This module is server-side only and should not be imported by client components
 */

import { promises as fs } from 'fs'
import path from 'path'
import { User, Audit, Document, Activity, Notification, Report, Alert } from './database'

// Ensure this module is only used on the server side
if (typeof window !== 'undefined') {
  throw new Error('FileDatabase can only be used on the server side')
}

// File paths for JSON data
const DATA_DIR = path.join(process.cwd(), 'src', 'data')
const FILE_PATHS = {
  users: path.join(DATA_DIR, 'users.json'),
  audits: path.join(DATA_DIR, 'audits.json'),
  documents: path.join(DATA_DIR, 'documents.json'),
  activities: path.join(DATA_DIR, 'activities.json'),
  notifications: path.join(DATA_DIR, 'notifications.json'),
  reports: path.join(DATA_DIR, 'reports.json'),
  alerts: path.join(DATA_DIR, 'alerts.json')
}

// File lock mechanism to prevent concurrent writes
const fileLocks = new Map<string, Promise<void>>()

/**
 * Acquire a file lock to prevent concurrent writes
 */
async function acquireFileLock(filePath: string): Promise<() => void> {
  const lockKey = filePath
  
  // Wait for any existing lock to be released
  while (fileLocks.has(lockKey)) {
    await fileLocks.get(lockKey)
  }
  
  // Create a new lock
  let releaseLock: () => void
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve
  })
  
  fileLocks.set(lockKey, lockPromise)
  
  return () => {
    fileLocks.delete(lockKey)
    releaseLock()
  }
}

/**
 * Read JSON data from file
 */
async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data) as T[]
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    return []
  }
}

/**
 * Write JSON data to file
 */
async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  const releaseLock = await acquireFileLock(filePath)
  
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    
    // Write data with pretty formatting
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } finally {
    releaseLock()
  }
}

/**
 * File-based Database Class
 * Provides persistent storage by reading/writing to JSON files
 */
export class FileDatabase {
  // User operations
  static async getUsers(): Promise<User[]> {
    return await readJsonFile<User>(FILE_PATHS.users)
  }

  static async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers()
    return users.find(user => user.id === id) || null
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers()
    return users.find(user => user.email === email) || null
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    const users = await this.getUsers()
    const index = users.findIndex(user => user.id === id)
    
    if (index === -1) return false

    // Update user data
    users[index] = { 
      ...users[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    }

    // Write back to file
    await writeJsonFile(FILE_PATHS.users, users)
    return true
  }

  static async addUser(user: User): Promise<boolean> {
    const users = await this.getUsers()
    users.push(user)
    await writeJsonFile(FILE_PATHS.users, users)
    return true
  }

  // Audit operations
  static async getAudits(): Promise<Audit[]> {
    return await readJsonFile<Audit>(FILE_PATHS.audits)
  }

  static async getAuditById(id: string): Promise<Audit | null> {
    const audits = await this.getAudits()
    return audits.find(audit => audit.id === id) || null
  }

  static async getAuditsByManager(managerId: string): Promise<Audit[]> {
    const audits = await this.getAudits()
    return audits.filter(audit => audit.auditManager === managerId)
  }

  static async getAuditsByAuditor(auditorId: string): Promise<Audit[]> {
    const audits = await this.getAudits()
    return audits.filter(audit => audit.assignedAuditors.includes(auditorId))
  }

  static async addAudit(audit: Audit): Promise<boolean> {
    const audits = await this.getAudits()
    audits.push(audit)
    await writeJsonFile(FILE_PATHS.audits, audits)
    return true
  }

  static async updateAudit(id: string, updates: Partial<Audit>): Promise<boolean> {
    const audits = await this.getAudits()
    const index = audits.findIndex(audit => audit.id === id)
    
    if (index === -1) return false

    // Update audit data
    audits[index] = { 
      ...audits[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    }

    // Write back to file
    await writeJsonFile(FILE_PATHS.audits, audits)
    return true
  }

  // Document operations
  static async getDocuments(): Promise<Document[]> {
    return await readJsonFile<Document>(FILE_PATHS.documents)
  }

  static async getDocumentById(id: string): Promise<Document | null> {
    const documents = await this.getDocuments()
    return documents.find(doc => doc.id === id) || null
  }

  static async getDocumentsByAudit(auditId: string): Promise<Document[]> {
    const documents = await this.getDocuments()
    return documents.filter(doc => doc.auditId === auditId)
  }

  static async getDocumentsByUser(userId: string): Promise<Document[]> {
    const documents = await this.getDocuments()
    return documents.filter(doc => doc.requestedBy === userId || doc.requestedFrom === userId)
  }

  static async updateDocument(id: string, updates: Partial<Document>): Promise<boolean> {
    const documents = await this.getDocuments()
    const index = documents.findIndex(doc => doc.id === id)
    
    if (index === -1) return false

    // Update document data
    documents[index] = { ...documents[index], ...updates }

    // Write back to file
    await writeJsonFile(FILE_PATHS.documents, documents)
    return true
  }

  static async addDocument(document: Document): Promise<boolean> {
    const documents = await this.getDocuments()
    documents.push(document)
    await writeJsonFile(FILE_PATHS.documents, documents)
    return true
  }

  // Activity operations
  static async getActivities(): Promise<Activity[]> {
    return await readJsonFile<Activity>(FILE_PATHS.activities)
  }

  static async getActivitiesByUser(userId: string): Promise<Activity[]> {
    const activities = await this.getActivities()
    return activities.filter(activity => activity.userId === userId)
  }

  static async getRecentActivities(limit: number = 50): Promise<Activity[]> {
    const activities = await this.getActivities()
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  static async addActivity(activity: Omit<Activity, 'id'>): Promise<boolean> {
    const activities = await this.getActivities()
    const newActivity: Activity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    activities.push(newActivity)
    await writeJsonFile(FILE_PATHS.activities, activities)
    return true
  }

  // Notification operations
  static async getNotifications(): Promise<Notification[]> {
    return await readJsonFile<Notification>(FILE_PATHS.notifications)
  }

  static async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const notifications = await this.getNotifications()
    return notifications.filter(notif => notif.userId === userId)
  }

  static async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
    const notifications = await this.getNotificationsByUser(userId)
    return notifications.filter(notif => notif.status === 'unread')
  }

  static async updateNotification(id: string, updates: Partial<Notification>): Promise<boolean> {
    const notifications = await this.getNotifications()
    const index = notifications.findIndex(notif => notif.id === id)
    
    if (index === -1) return false

    // Update notification data
    notifications[index] = { ...notifications[index], ...updates }

    // Write back to file
    await writeJsonFile(FILE_PATHS.notifications, notifications)
    return true
  }

  static async addNotification(notification: Omit<Notification, 'id' | 'status' | 'createdAt' | 'readAt'>): Promise<boolean> {
    const notifications = await this.getNotifications()
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "unread",
      createdAt: new Date().toISOString(),
      readAt: null
    }
    
    notifications.push(newNotification)
    await writeJsonFile(FILE_PATHS.notifications, notifications)
    return true
  }

  // Alert operations
  static async getAlerts(): Promise<Alert[]> {
    return await readJsonFile<Alert>(FILE_PATHS.alerts)
  }

  static async getActiveAlerts(): Promise<Alert[]> {
    const alerts = await this.getAlerts()
    return alerts.filter(alert => alert.status === 'active')
  }

  static async getAlertsBySeverity(severity: string): Promise<Alert[]> {
    const alerts = await this.getAlerts()
    return alerts.filter(alert => alert.severity === severity)
  }

  static async addAlert(alert: Alert): Promise<boolean> {
    const alerts = await this.getAlerts()
    alerts.push(alert)
    await writeJsonFile(FILE_PATHS.alerts, alerts)
    return true
  }

  static async updateAlert(alertId: string, updates: Partial<Alert>): Promise<boolean> {
    const alerts = await this.getAlerts()
    const alertIndex = alerts.findIndex(alert => alert.id === alertId)
    
    if (alertIndex === -1) return false

    alerts[alertIndex] = { ...alerts[alertIndex], ...updates }
    await writeJsonFile(FILE_PATHS.alerts, alerts)
    return true
  }

  static async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    return await this.updateAlert(alertId, {
      status: 'acknowledged',
      acknowledgedBy,
      acknowledgedAt: new Date().toISOString()
    })
  }

  static async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    return await this.updateAlert(alertId, {
      status: 'resolved',
      resolvedBy,
      resolvedAt: new Date().toISOString()
    })
  }

  static async dismissAlert(alertId: string): Promise<boolean> {
    return await this.updateAlert(alertId, {
      status: 'dismissed'
    })
  }

  // Report operations
  static async getReports(): Promise<Report[]> {
    return await readJsonFile<Report>(FILE_PATHS.reports)
  }

  static async getReportById(id: string): Promise<Report | undefined> {
    const reports = await this.getReports()
    return reports.find(report => report.id === id)
  }

  static async getReportsByAuditId(auditId: string): Promise<Report[]> {
    const reports = await this.getReports()
    return reports.filter(report => report.auditId === auditId)
  }

  static async addReport(report: Report): Promise<void> {
    const reports = await this.getReports()
    reports.push(report)
    await writeJsonFile(FILE_PATHS.reports, reports)
  }

  static async updateReport(id: string, updates: Partial<Report>): Promise<boolean> {
    const reports = await this.getReports()
    const index = reports.findIndex(report => report.id === id)
    
    if (index === -1) return false

    reports[index] = { ...reports[index], ...updates }
    await writeJsonFile(FILE_PATHS.reports, reports)
    return true
  }

  static async deleteReport(id: string): Promise<boolean> {
    const reports = await this.getReports()
    const index = reports.findIndex(report => report.id === id)
    
    if (index === -1) return false

    reports.splice(index, 1)
    await writeJsonFile(FILE_PATHS.reports, reports)
    return true
  }

  // Utility methods
  static async getStats() {
    const users = await this.getUsers()
    const audits = await this.getAudits()
    const documents = await this.getDocuments()
    const activities = await this.getActivities()
    const notifications = await this.getNotifications()

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

  // File management utilities
  static async getFileStats(): Promise<Record<string, { exists: boolean; size?: number; lastModified?: string }>> {
    const stats: Record<string, { exists: boolean; size?: number; lastModified?: string }> = {}
    
    for (const [key, filePath] of Object.entries(FILE_PATHS)) {
      try {
        const stat = await fs.stat(filePath)
        stats[key] = {
          exists: true,
          size: stat.size,
          lastModified: stat.mtime.toISOString()
        }
      } catch (error) {
        stats[key] = { exists: false }
      }
    }
    
    return stats
  }

  static async backupData(): Promise<{ success: boolean; message: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupDir = path.join(process.cwd(), 'data', 'backups', timestamp)
      
      await fs.mkdir(backupDir, { recursive: true })
      
      for (const [key, filePath] of Object.entries(FILE_PATHS)) {
        try {
          const data = await fs.readFile(filePath, 'utf-8')
          const backupPath = path.join(backupDir, `${key}.json`)
          await fs.writeFile(backupPath, data, 'utf-8')
        } catch (error) {
          console.warn(`Could not backup ${key}:`, error)
        }
      }
      
      return {
        success: true,
        message: `Backup created at ${backupDir}`
      }
    } catch (error) {
      return {
        success: false,
        message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}
