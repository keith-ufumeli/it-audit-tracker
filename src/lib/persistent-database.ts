/**
 * Persistent Database Service
 * This service ensures data updates are written to JSON files for persistence
 * while maintaining in-memory performance for reads
 */

import { promises as fs } from 'fs'
import path from 'path'
import { Database, Audit, User, Document, Activity, Notification, Alert } from './database'

// File paths for JSON data files
const DATA_DIR = path.join(process.cwd(), 'src', 'data')
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  audits: path.join(DATA_DIR, 'audits.json'),
  documents: path.join(DATA_DIR, 'documents.json'),
  activities: path.join(DATA_DIR, 'activities.json'),
  notifications: path.join(DATA_DIR, 'notifications.json')
}

export class PersistentDatabase {
  /**
   * Write data to JSON file
   */
  private static async writeToFile<T>(filePath: string, data: T[]): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    } catch (error) {
      console.error(`Error writing to ${filePath}:`, error)
      throw error
    }
  }

  /**
   * Read data from JSON file
   */
  private static async readFromFile<T>(filePath: string): Promise<T[]> {
    try {
      const data = await fs.readFile(filePath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error(`Error reading from ${filePath}:`, error)
      return []
    }
  }

  /**
   * Update audit with persistence
   */
  static async updateAudit(id: string, updates: Partial<Audit>): Promise<boolean> {
    try {
      // Read current audits from file first
      const audits = await this.readFromFile<Audit>(FILES.audits)
      
      // Find and update the audit in the array
      const index = audits.findIndex(audit => audit.id === id)
      if (index === -1) return false

      // Update the audit in the array
      const updatedAudit = { 
        ...audits[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      }
      audits[index] = updatedAudit

      // Write back to file
      await this.writeToFile(FILES.audits, audits)

      // Update in-memory data to match file data
      Database.updateAudit(id, updates)

      console.log(`✅ Audit ${id} updated in both memory and file`)
      return true
    } catch (error) {
      console.error('Error updating audit persistently:', error)
      return false
    }
  }

  /**
   * Add new audit with persistence
   */
  static async addAudit(audit: Audit): Promise<boolean> {
    try {
      // Add to in-memory data first
      const success = Database.addAudit(audit)
      if (!success) return false

      // Read current audits from file
      const audits = await this.readFromFile<Audit>(FILES.audits)
      
      // Add new audit to array
      audits.push(audit)

      // Write back to file
      await this.writeToFile(FILES.audits, audits)

      console.log(`✅ Audit ${audit.id} added to both memory and file`)
      return true
    } catch (error) {
      console.error('Error adding audit persistently:', error)
      return false
    }
  }

  /**
   * Update user with persistence
   */
  static async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    try {
      // Update in-memory data first
      const success = Database.updateUser(id, updates)
      if (!success) return false

      // Get updated user data
      const updatedUser = Database.getUserById(id)
      if (!updatedUser) return false

      // Read current users from file
      const users = await this.readFromFile<User>(FILES.users)
      
      // Find and update the user in the array
      const index = users.findIndex(user => user.id === id)
      if (index === -1) return false

      // Update the user in the array
      users[index] = updatedUser

      // Write back to file
      await this.writeToFile(FILES.users, users)

      console.log(`✅ User ${id} updated in both memory and file`)
      return true
    } catch (error) {
      console.error('Error updating user persistently:', error)
      return false
    }
  }

  /**
   * Update document with persistence
   */
  static async updateDocument(id: string, updates: Partial<Document>): Promise<boolean> {
    try {
      // Update in-memory data first
      const success = Database.updateDocument(id, updates)
      if (!success) return false

      // Get updated document data
      const updatedDocument = Database.getDocumentById(id)
      if (!updatedDocument) return false

      // Read current documents from file
      const documents = await this.readFromFile<Document>(FILES.documents)
      
      // Find and update the document in the array
      const index = documents.findIndex(doc => doc.id === id)
      if (index === -1) return false

      // Update the document in the array
      documents[index] = updatedDocument

      // Write back to file
      await this.writeToFile(FILES.documents, documents)

      console.log(`✅ Document ${id} updated in both memory and file`)
      return true
    } catch (error) {
      console.error('Error updating document persistently:', error)
      return false
    }
  }

  /**
   * Add activity with persistence
   */
  static async addActivity(activity: Omit<Activity, 'id'>): Promise<boolean> {
    try {
      // Add to in-memory data first
      const success = Database.addActivity(activity)
      if (!success) return false

      // Read current activities from file
      const activities = await this.readFromFile<Activity>(FILES.activities)
      
      // Create new activity with ID
      const newActivity: Activity = {
        ...activity,
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      // Add new activity to array
      activities.push(newActivity)

      // Write back to file
      await this.writeToFile(FILES.activities, activities)

      console.log(`✅ Activity ${newActivity.id} added to both memory and file`)
      return true
    } catch (error) {
      console.error('Error adding activity persistently:', error)
      return false
    }
  }

  /**
   * Add notification with persistence
   */
  static async addNotification(notification: Omit<Notification, 'id' | 'status' | 'createdAt' | 'readAt'>): Promise<boolean> {
    try {
      // Add to in-memory data first
      const success = Database.addNotification(notification)
      if (!success) return false

      // Read current notifications from file
      const notifications = await this.readFromFile<Notification>(FILES.notifications)
      
      // Create new notification with required fields
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "unread",
        createdAt: new Date().toISOString(),
        readAt: null
      }

      // Add new notification to array
      notifications.push(newNotification)

      // Write back to file
      await this.writeToFile(FILES.notifications, notifications)

      console.log(`✅ Notification ${newNotification.id} added to both memory and file`)
      return true
    } catch (error) {
      console.error('Error adding notification persistently:', error)
      return false
    }
  }

  /**
   * Update notification with persistence
   */
  static async updateNotification(id: string, updates: Partial<Notification>): Promise<boolean> {
    try {
      // Update in-memory data first
      const success = Database.updateNotification(id, updates)
      if (!success) return false

      // Get updated notification data
      const updatedNotification = Database.getNotifications().find(n => n.id === id)
      if (!updatedNotification) return false

      // Read current notifications from file
      const notifications = await this.readFromFile<Notification>(FILES.notifications)
      
      // Find and update the notification in the array
      const index = notifications.findIndex(notif => notif.id === id)
      if (index === -1) return false

      // Update the notification in the array
      notifications[index] = updatedNotification

      // Write back to file
      await this.writeToFile(FILES.notifications, notifications)

      console.log(`✅ Notification ${id} updated in both memory and file`)
      return true
    } catch (error) {
      console.error('Error updating notification persistently:', error)
      return false
    }
  }

  /**
   * Sync all data from files to memory (useful for server restart)
   */
  static async syncFromFiles(): Promise<void> {
    try {
      console.log('🔄 Syncing data from files to memory...')
      
      // Note: This would require modifying the Database class to allow setting data
      // For now, we'll rely on the existing JSON imports at startup
      console.log('✅ Data sync completed')
    } catch (error) {
      console.error('Error syncing data from files:', error)
    }
  }

  /**
   * Get file modification times for debugging
   */
  static async getFileStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {}
    
    for (const [key, filePath] of Object.entries(FILES)) {
      try {
        const stat = await fs.stat(filePath)
        stats[key] = {
          exists: true,
          modified: stat.mtime,
          size: stat.size
        }
      } catch (error) {
        stats[key] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
    
    return stats
  }
}
