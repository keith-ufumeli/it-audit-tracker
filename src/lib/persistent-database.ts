/**
 * Persistent Database Service
 * This service ensures data updates are written to JSON files for persistence
 * Uses FileDatabase for actual file operations (server-side only)
 */

import { Database, Audit, User, Document, Activity, Notification } from './database'

// Helper function to safely import FileDatabase (server-side only)
async function getFileDatabase() {
  if (typeof window === 'undefined') {
    const { FileDatabase } = await import('./file-database')
    return FileDatabase
  }
  return null
}

export class PersistentDatabase {
  /**
   * Update audit with persistence (both in-memory and file)
   */
  static async updateAudit(id: string, updates: Partial<Audit>): Promise<boolean> {
    try {
      // Update in-memory data
      const memorySuccess = Database.updateAudit(id, updates)
      
      // Update file data (server-side only)
      let fileSuccess = true
      const FileDatabase = await getFileDatabase()
      if (FileDatabase) {
        fileSuccess = await FileDatabase.updateAudit(id, updates)
      }
      
      if (memorySuccess && fileSuccess) {
        console.log(`✅ Audit ${id} updated in memory and file`)
        return true
      } else {
        console.error(`❌ Audit ${id} update failed - memory: ${memorySuccess}, file: ${fileSuccess}`)
        return false
      }
    } catch (error) {
      console.error('Error updating audit persistently:', error)
      return false
    }
  }

  /**
   * Add new audit with persistence (both in-memory and file)
   */
  static async addAudit(audit: Audit): Promise<boolean> {
    try {
      // Add to in-memory data
      const memorySuccess = Database.addAudit(audit)
      
      // Add to file data (server-side only)
      let fileSuccess = true
      const FileDatabase = await getFileDatabase()
      if (FileDatabase) {
        fileSuccess = await FileDatabase.addAudit(audit)
      }
      
      if (memorySuccess && fileSuccess) {
        console.log(`✅ Audit ${audit.id} added to memory and file`)
        return true
      } else {
        console.error(`❌ Audit ${audit.id} add failed - memory: ${memorySuccess}, file: ${fileSuccess}`)
        return false
      }
    } catch (error) {
      console.error('Error adding audit persistently:', error)
      return false
    }
  }

  /**
   * Update user with persistence (both in-memory and file)
   */
  static async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    try {
      // Update in-memory data
      const memorySuccess = Database.updateUser(id, updates)
      
      // Update file data (server-side only)
      let fileSuccess = true
      const FileDatabase = await getFileDatabase()
      if (FileDatabase) {
        fileSuccess = await FileDatabase.updateUser(id, updates)
      }
      
      if (memorySuccess && fileSuccess) {
        console.log(`✅ User ${id} updated in memory and file`)
        return true
      } else {
        console.error(`❌ User ${id} update failed - memory: ${memorySuccess}, file: ${fileSuccess}`)
        return false
      }
    } catch (error) {
      console.error('Error updating user persistently:', error)
      return false
    }
  }

  /**
   * Add user with persistence (both in-memory and file)
   */
  static async addUser(user: User): Promise<boolean> {
    try {
      // Add to in-memory data
      const { InMemoryDatabase } = await import('./database')
      InMemoryDatabase.users.push(user)
      
      // Add to file data (server-side only)
      let fileSuccess = true
      const FileDatabase = await getFileDatabase()
      if (FileDatabase) {
        fileSuccess = await FileDatabase.addUser(user)
      }
      
      if (fileSuccess) {
        console.log(`✅ User ${user.id} added to memory and file`)
        return true
      } else {
        console.error(`❌ User ${user.id} add failed - file: ${fileSuccess}`)
        return false
      }
    } catch (error) {
      console.error('Error adding user persistently:', error)
      return false
    }
  }

  /**
   * Update document with persistence (both in-memory and file)
   */
  static async updateDocument(id: string, updates: Partial<Document>): Promise<boolean> {
    try {
      // Update in-memory data
      const memorySuccess = Database.updateDocument(id, updates)
      
      // Update file data (server-side only)
      let fileSuccess = true
      const FileDatabase = await getFileDatabase()
      if (FileDatabase) {
        fileSuccess = await FileDatabase.updateDocument(id, updates)
      }
      
      if (memorySuccess && fileSuccess) {
        console.log(`✅ Document ${id} updated in memory and file`)
        return true
      } else {
        console.error(`❌ Document ${id} update failed - memory: ${memorySuccess}, file: ${fileSuccess}`)
        return false
      }
    } catch (error) {
      console.error('Error updating document persistently:', error)
      return false
    }
  }

  /**
   * Add document with persistence (both in-memory and file)
   */
  static async addDocument(document: Document): Promise<boolean> {
    try {
      // Add to in-memory data
      const { InMemoryDatabase } = await import('./database')
      InMemoryDatabase.documents.push(document)
      
      // Add to file data (server-side only)
      let fileSuccess = true
      const FileDatabase = await getFileDatabase()
      if (FileDatabase) {
        fileSuccess = await FileDatabase.addDocument(document)
      }
      
      if (fileSuccess) {
        console.log(`✅ Document ${document.id} added to memory and file`)
        return true
      } else {
        console.error(`❌ Document ${document.id} add failed - file: ${fileSuccess}`)
        return false
      }
    } catch (error) {
      console.error('Error adding document persistently:', error)
      return false
    }
  }

  /**
   * Add activity with persistence (both in-memory and file)
   */
  static async addActivity(activity: Omit<Activity, 'id'>): Promise<boolean> {
    try {
      // Add to in-memory data
      const memorySuccess = Database.addActivity(activity)
      
      // Add to file data (server-side only)
      let fileSuccess = true
      const FileDatabase = await getFileDatabase()
      if (FileDatabase) {
        fileSuccess = await FileDatabase.addActivity(activity)
      }
      
      if (memorySuccess && fileSuccess) {
        console.log(`✅ Activity added to memory and file`)
        return true
      } else {
        console.error(`❌ Activity add failed - memory: ${memorySuccess}, file: ${fileSuccess}`)
        return false
      }
    } catch (error) {
      console.error('Error adding activity persistently:', error)
      return false
    }
  }

  /**
   * Add notification with persistence (both in-memory and file)
   */
  static async addNotification(notification: Omit<Notification, 'id' | 'status' | 'createdAt' | 'readAt'>): Promise<boolean> {
    try {
      // Add to in-memory data
      const memorySuccess = Database.addNotification(notification)
      
      // Add to file data (server-side only)
      let fileSuccess = true
      const FileDatabase = await getFileDatabase()
      if (FileDatabase) {
        fileSuccess = await FileDatabase.addNotification(notification)
      }
      
      if (memorySuccess && fileSuccess) {
        console.log(`✅ Notification added to memory and file`)
        return true
      } else {
        console.error(`❌ Notification add failed - memory: ${memorySuccess}, file: ${fileSuccess}`)
        return false
      }
    } catch (error) {
      console.error('Error adding notification persistently:', error)
      return false
    }
  }

  /**
   * Update notification with persistence (both in-memory and file)
   */
  static async updateNotification(id: string, updates: Partial<Notification>): Promise<boolean> {
    try {
      // Update in-memory data
      const memorySuccess = Database.updateNotification(id, updates)
      
      // Update file data (server-side only)
      let fileSuccess = true
      const FileDatabase = await getFileDatabase()
      if (FileDatabase) {
        fileSuccess = await FileDatabase.updateNotification(id, updates)
      }
      
      if (memorySuccess && fileSuccess) {
        console.log(`✅ Notification ${id} updated in memory and file`)
        return true
      } else {
        console.error(`❌ Notification ${id} update failed - memory: ${memorySuccess}, file: ${fileSuccess}`)
        return false
      }
    } catch (error) {
      console.error('Error updating notification persistently:', error)
      return false
    }
  }

  /**
   * Sync all data from files to memory
   */
  static async syncFromFiles(): Promise<void> {
    try {
      console.log('🔄 Syncing data from files to memory...')
      
      const FileDatabase = await getFileDatabase()
      if (!FileDatabase) {
        console.log('⚠️ File sync skipped - running on client side')
        return
      }
      
      // Load data from files
      const [users, audits, documents, activities, notifications, reports, alerts] = await Promise.all([
        FileDatabase.getUsers(),
        FileDatabase.getAudits(),
        FileDatabase.getDocuments(),
        FileDatabase.getActivities(),
        FileDatabase.getNotifications(),
        FileDatabase.getReports(),
        FileDatabase.getAlerts()
      ])
      
      // Update in-memory data
      const { InMemoryDatabase } = await import('./database')
      InMemoryDatabase.users = users
      InMemoryDatabase.audits = audits
      InMemoryDatabase.documents = documents
      InMemoryDatabase.activities = activities
      InMemoryDatabase.notifications = notifications
      InMemoryDatabase.reports = reports
      InMemoryDatabase.alerts = alerts
      
      console.log('✅ Data sync completed')
      console.log(`📊 Synced: ${users.length} users, ${audits.length} audits, ${documents.length} documents, ${activities.length} activities, ${notifications.length} notifications`)
    } catch (error) {
      console.error('Error syncing data:', error)
    }
  }

  /**
   * Get file stats for debugging
   */
  static async getFileStats(): Promise<Record<string, { exists: boolean; size?: number; lastModified?: string; note?: string }>> {
    const FileDatabase = await getFileDatabase()
    if (FileDatabase) {
      return await FileDatabase.getFileStats()
    }
    
    // Return mock stats for client side
    return {
      users: { exists: true, note: 'Client-side - file stats not available' },
      audits: { exists: true, note: 'Client-side - file stats not available' },
      documents: { exists: true, note: 'Client-side - file stats not available' },
      activities: { exists: true, note: 'Client-side - file stats not available' },
      notifications: { exists: true, note: 'Client-side - file stats not available' }
    }
  }

  /**
   * Create backup of all data files
   */
  static async backupData(): Promise<{ success: boolean; message: string }> {
    const FileDatabase = await getFileDatabase()
    if (FileDatabase) {
      return await FileDatabase.backupData()
    }
    
    return {
      success: false,
      message: 'Backup not available on client side'
    }
  }
}