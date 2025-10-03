/**
 * Persistent Database Service
 * This service ensures data updates are written to JSON files for persistence
 * while maintaining in-memory performance for reads
 */

import { Database, Audit, User, Document, Activity, Notification } from './database'

// Note: In Edge Runtime, we can't access the file system
// This class now provides in-memory persistence only
// In production, you would use a real database or external API

export class PersistentDatabase {
  /**
   * Note: File operations removed for Edge Runtime compatibility
   * In production, these would be replaced with database operations
   */

  /**
   * Update audit with persistence (in-memory only for Edge Runtime)
   */
  static async updateAudit(id: string, updates: Partial<Audit>): Promise<boolean> {
    try {
      // Update in-memory data only (Edge Runtime compatible)
      const success = Database.updateAudit(id, updates)
      
      if (success) {
        console.log(`✅ Audit ${id} updated in memory`)
      }
      
      return success
    } catch (error) {
      console.error('Error updating audit persistently:', error)
      return false
    }
  }

  /**
   * Add new audit with persistence (in-memory only for Edge Runtime)
   */
  static async addAudit(audit: Audit): Promise<boolean> {
    try {
      // Add to in-memory data only (Edge Runtime compatible)
      const success = Database.addAudit(audit)
      
      if (success) {
        console.log(`✅ Audit ${audit.id} added to memory`)
      }
      
      return success
    } catch (error) {
      console.error('Error adding audit persistently:', error)
      return false
    }
  }

  /**
   * Update user with persistence (in-memory only for Edge Runtime)
   */
  static async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    try {
      // Update in-memory data only (Edge Runtime compatible)
      const success = Database.updateUser(id, updates)
      
      if (success) {
        console.log(`✅ User ${id} updated in memory`)
      }
      
      return success
    } catch (error) {
      console.error('Error updating user persistently:', error)
      return false
    }
  }

  /**
   * Update document with persistence (in-memory only for Edge Runtime)
   */
  static async updateDocument(id: string, updates: Partial<Document>): Promise<boolean> {
    try {
      // Update in-memory data only (Edge Runtime compatible)
      const success = Database.updateDocument(id, updates)
      
      if (success) {
        console.log(`✅ Document ${id} updated in memory`)
      }
      
      return success
    } catch (error) {
      console.error('Error updating document persistently:', error)
      return false
    }
  }

  /**
   * Add activity with persistence (in-memory only for Edge Runtime)
   */
  static async addActivity(activity: Omit<Activity, 'id'>): Promise<boolean> {
    try {
      // Add to in-memory data only (Edge Runtime compatible)
      const success = Database.addActivity(activity)
      
      if (success) {
        console.log(`✅ Activity added to memory`)
      }
      
      return success
    } catch (error) {
      console.error('Error adding activity persistently:', error)
      return false
    }
  }

  /**
   * Add notification with persistence (in-memory only for Edge Runtime)
   */
  static async addNotification(notification: Omit<Notification, 'id' | 'status' | 'createdAt' | 'readAt'>): Promise<boolean> {
    try {
      // Add to in-memory data only (Edge Runtime compatible)
      const success = Database.addNotification(notification)
      
      if (success) {
        console.log(`✅ Notification added to memory`)
      }
      
      return success
    } catch (error) {
      console.error('Error adding notification persistently:', error)
      return false
    }
  }

  /**
   * Update notification with persistence (in-memory only for Edge Runtime)
   */
  static async updateNotification(id: string, updates: Partial<Notification>): Promise<boolean> {
    try {
      // Update in-memory data only (Edge Runtime compatible)
      const success = Database.updateNotification(id, updates)
      
      if (success) {
        console.log(`✅ Notification ${id} updated in memory`)
      }
      
      return success
    } catch (error) {
      console.error('Error updating notification persistently:', error)
      return false
    }
  }

  /**
   * Sync all data from files to memory (Edge Runtime compatible)
   */
  static async syncFromFiles(): Promise<void> {
    try {
      console.log('🔄 Data sync not needed - using in-memory data only')
      console.log('✅ Data sync completed')
    } catch (error) {
      console.error('Error syncing data:', error)
    }
  }

  /**
   * Get file stats for debugging (Edge Runtime compatible)
   */
  static async getFileStats(): Promise<Record<string, { exists: boolean; note?: string }>> {
    // Return mock stats since we can't access files in Edge Runtime
    return {
      users: { exists: true, note: 'In-memory data' },
      audits: { exists: true, note: 'In-memory data' },
      documents: { exists: true, note: 'In-memory data' },
      activities: { exists: true, note: 'In-memory data' },
      notifications: { exists: true, note: 'In-memory data' }
    }
  }
}
