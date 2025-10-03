// Client-safe database interface that doesn't import Node.js modules
// This is used by client components to avoid Edge Runtime issues

import type { 
  User, 
  Audit, 
  Document, 
  Notification, 
  Activity, 
  Alert,
  Report 
} from './database'

// Client-safe database operations that use API calls instead of direct file access
export class ClientDatabase {
  // User operations
  static async getUsers(): Promise<User[]> {
    const response = await fetch('/api/users')
    const result = await response.json()
    return result.success ? result.data : []
  }

  static async getUserById(id: string): Promise<User | null> {
    const response = await fetch(`/api/users/${id}`)
    const result = await response.json()
    return result.success ? result.data : null
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers()
    return users.find(user => user.email === email) || null
  }

  // Audit operations
  static async getAudits(): Promise<Audit[]> {
    const response = await fetch('/api/audits')
    const result = await response.json()
    return result.success ? result.data : []
  }

  static async getAuditById(id: string): Promise<Audit | null> {
    const response = await fetch(`/api/audits/${id}`)
    const result = await response.json()
    return result.success ? result.data : null
  }

  // Document operations
  static async getDocuments(): Promise<Document[]> {
    const response = await fetch('/api/documents')
    const result = await response.json()
    return result.success ? result.data : []
  }

  static async getDocumentById(id: string): Promise<Document | null> {
    const response = await fetch(`/api/documents/${id}`)
    const result = await response.json()
    return result.success ? result.data : null
  }

  // Notification operations
  static async getNotifications(): Promise<Notification[]> {
    const response = await fetch('/api/notifications')
    const result = await response.json()
    return result.success ? result.data : []
  }

  // Activity operations
  static async getActivities(): Promise<Activity[]> {
    const response = await fetch('/api/activities')
    const result = await response.json()
    return result.success ? result.data : []
  }

  // Alert operations
  static async getAlerts(): Promise<Alert[]> {
    const response = await fetch('/api/alerts')
    const result = await response.json()
    return result.success ? result.data : []
  }

  // Report operations
  static async getReports(): Promise<Report[]> {
    const response = await fetch('/api/reports')
    const result = await response.json()
    return result.success ? result.data : []
  }
}

// Export types for client use
export type {
  User,
  Audit,
  Document,
  Notification,
  Activity,
  Alert,
  Report
}
