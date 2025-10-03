// Comprehensive Audit Trail Logging System
// Tracks all system actions with detailed information for compliance and security

import type { User } from "@/types/user"

export interface AuditTrailEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  sessionId: string
  action: string
  resource: string
  resourceId?: string
  resourceType: string
  beforeState?: any
  afterState?: any
  ipAddress: string
  userAgent: string
  endpoint: string
  method: string
  statusCode: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  complianceRelevant: boolean
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted'
  description: string
  metadata: Record<string, any>
  tags: string[]
  correlationId?: string
  parentActionId?: string
}

export interface AuditTrailFilter {
  userId?: string
  action?: string
  resource?: string
  resourceType?: string
  riskLevel?: string
  complianceRelevant?: boolean
  dataClassification?: string
  startDate?: string
  endDate?: string
  tags?: string[]
  limit?: number
  offset?: number
}

export interface AuditTrailStats {
  totalEntries: number
  entriesByAction: Record<string, number>
  entriesByRiskLevel: Record<string, number>
  entriesByUser: Record<string, number>
  complianceRelevantCount: number
  criticalRiskCount: number
  timeRange: {
    start: string
    end: string
  }
}

export class AuditTrailLogger {
  private static instance: AuditTrailLogger
  private entries: AuditTrailEntry[] = []
  private maxEntries: number = 100000 // Maximum entries to keep in memory

  private constructor() {}

  public static getInstance(): AuditTrailLogger {
    if (!AuditTrailLogger.instance) {
      AuditTrailLogger.instance = new AuditTrailLogger()
    }
    return AuditTrailLogger.instance
  }

  // Log a comprehensive audit trail entry
  public async logEntry(entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): Promise<string> {
    const auditEntry: AuditTrailEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry
    }

    // Add to in-memory store
    this.entries.unshift(auditEntry) // Add to beginning for newest first

    // Maintain max entries limit
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries)
    }

    // Persist to database using dynamic import
    if (typeof window === 'undefined') {
      try {
        const { Database } = await import('./database')
        Database.addActivity({
          id: auditEntry.id,
          userId: auditEntry.userId,
          userName: auditEntry.userName,
          userRole: auditEntry.userRole,
          action: auditEntry.action,
          description: auditEntry.description,
          timestamp: auditEntry.timestamp,
          ipAddress: auditEntry.ipAddress,
          userAgent: auditEntry.userAgent,
          severity: this.mapRiskLevelToSeverity(auditEntry.riskLevel),
          resource: auditEntry.resource,
          resourceId: auditEntry.resourceId,
          metadata: {
            ...auditEntry.metadata,
            sessionId: auditEntry.sessionId,
            endpoint: auditEntry.endpoint,
            method: auditEntry.method,
            statusCode: auditEntry.statusCode,
            riskLevel: auditEntry.riskLevel,
            complianceRelevant: auditEntry.complianceRelevant,
            dataClassification: auditEntry.dataClassification,
            beforeState: auditEntry.beforeState,
            afterState: auditEntry.afterState,
            tags: auditEntry.tags,
            correlationId: auditEntry.correlationId,
            parentActionId: auditEntry.parentActionId
          }
        })
      } catch (error) {
        console.error('Failed to persist audit trail entry:', error)
      }
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT TRAIL] ${auditEntry.action} by ${auditEntry.userName} (${auditEntry.userRole})`, {
        resource: auditEntry.resource,
        riskLevel: auditEntry.riskLevel,
        complianceRelevant: auditEntry.complianceRelevant
      })
    }

    return auditEntry.id
  }

  // Log authentication events
  public async logAuthentication(
    userId: string,
    userName: string,
    userRole: string,
    action: 'login' | 'logout' | 'login_failed' | 'password_change' | 'account_locked',
    ipAddress: string,
    userAgent: string,
    sessionId: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const riskLevel = action === 'login_failed' || action === 'account_locked' ? 'high' : 'low'
    
    return this.logEntry({
      userId,
      userName,
      userRole,
      sessionId,
      action,
      resource: 'authentication',
      resourceType: 'user_session',
      ipAddress,
      userAgent,
      endpoint: '/api/auth',
      method: 'POST',
      statusCode: action === 'login_failed' ? 401 : 200,
      riskLevel,
      complianceRelevant: true,
      dataClassification: 'confidential',
      description: `User ${action} for ${userName}`,
      metadata,
      tags: ['authentication', 'security']
    })
  }

  // Log data access events
  public async logDataAccess(
    userId: string,
    userName: string,
    userRole: string,
    resource: string,
    resourceId: string,
    resourceType: string,
    action: 'read' | 'create' | 'update' | 'delete' | 'export',
    ipAddress: string,
    userAgent: string,
    sessionId: string,
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted' = 'internal',
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const riskLevel = this.determineDataAccessRiskLevel(action, dataClassification)
    const complianceRelevant = dataClassification === 'confidential' || dataClassification === 'restricted'
    
    return this.logEntry({
      userId,
      userName,
      userRole,
      sessionId,
      action,
      resource,
      resourceId,
      resourceType,
      ipAddress,
      userAgent,
      endpoint: `/api/${resource}/${resourceId}`,
      method: this.mapActionToMethod(action),
      statusCode: 200,
      riskLevel,
      complianceRelevant,
      dataClassification,
      description: `User ${action} ${resourceType} ${resourceId}`,
      metadata,
      tags: ['data_access', dataClassification]
    })
  }

  // Log system configuration changes
  public async logSystemChange(
    userId: string,
    userName: string,
    userRole: string,
    resource: string,
    resourceId: string,
    beforeState: any,
    afterState: any,
    ipAddress: string,
    userAgent: string,
    sessionId: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    return this.logEntry({
      userId,
      userName,
      userRole,
      sessionId,
      action: 'update',
      resource,
      resourceId,
      resourceType: 'system_configuration',
      beforeState,
      afterState,
      ipAddress,
      userAgent,
      endpoint: `/api/${resource}/${resourceId}`,
      method: 'PUT',
      statusCode: 200,
      riskLevel: 'high',
      complianceRelevant: true,
      dataClassification: 'confidential',
      description: `System configuration change: ${resource} ${resourceId}`,
      metadata,
      tags: ['system_change', 'configuration']
    })
  }

  // Log security events
  public async logSecurityEvent(
    userId: string,
    userName: string,
    userRole: string,
    action: string,
    resource: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    ipAddress: string,
    userAgent: string,
    sessionId: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    return this.logEntry({
      userId,
      userName,
      userRole,
      sessionId,
      action,
      resource,
      resourceType: 'security_event',
      ipAddress,
      userAgent,
      endpoint: '/api/security',
      method: 'POST',
      statusCode: 200,
      riskLevel,
      complianceRelevant: true,
      dataClassification: 'restricted',
      description: `Security event: ${action}`,
      metadata,
      tags: ['security', 'compliance']
    })
  }

  // Get audit trail entries with filtering
  public async getEntries(filter: AuditTrailFilter = {}): Promise<AuditTrailEntry[]> {
    let filteredEntries = [...this.entries]

    // Apply filters
    if (filter.userId) {
      filteredEntries = filteredEntries.filter(entry => entry.userId === filter.userId)
    }
    if (filter.action) {
      filteredEntries = filteredEntries.filter(entry => entry.action === filter.action)
    }
    if (filter.resource) {
      filteredEntries = filteredEntries.filter(entry => entry.resource === filter.resource)
    }
    if (filter.riskLevel) {
      filteredEntries = filteredEntries.filter(entry => entry.riskLevel === filter.riskLevel)
    }
    if (filter.complianceRelevant !== undefined) {
      filteredEntries = filteredEntries.filter(entry => entry.complianceRelevant === filter.complianceRelevant)
    }
    if (filter.dataClassification) {
      filteredEntries = filteredEntries.filter(entry => entry.dataClassification === filter.dataClassification)
    }
    if (filter.startDate) {
      filteredEntries = filteredEntries.filter(entry => entry.timestamp >= filter.startDate!)
    }
    if (filter.endDate) {
      filteredEntries = filteredEntries.filter(entry => entry.timestamp <= filter.endDate!)
    }
    if (filter.tags && filter.tags.length > 0) {
      filteredEntries = filteredEntries.filter(entry => 
        filter.tags!.some(tag => entry.tags.includes(tag))
      )
    }

    // Apply pagination
    const offset = filter.offset || 0
    const limit = filter.limit || 100
    return filteredEntries.slice(offset, offset + limit)
  }

  // Get audit trail statistics
  public getStats(timeRange?: { start: string; end: string }): AuditTrailStats {
    let entries = this.entries

    if (timeRange) {
      entries = entries.filter(entry => 
        entry.timestamp >= timeRange.start && entry.timestamp <= timeRange.end
      )
    }

    const entriesByAction: Record<string, number> = {}
    const entriesByRiskLevel: Record<string, number> = {}
    const entriesByUser: Record<string, number> = {}

    entries.forEach(entry => {
      entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1
      entriesByRiskLevel[entry.riskLevel] = (entriesByRiskLevel[entry.riskLevel] || 0) + 1
      entriesByUser[entry.userId] = (entriesByUser[entry.userId] || 0) + 1
    })

    return {
      totalEntries: entries.length,
      entriesByAction,
      entriesByRiskLevel,
      entriesByUser,
      complianceRelevantCount: entries.filter(entry => entry.complianceRelevant).length,
      criticalRiskCount: entries.filter(entry => entry.riskLevel === 'critical').length,
      timeRange: {
        start: entries.length > 0 ? entries[entries.length - 1].timestamp : new Date().toISOString(),
        end: entries.length > 0 ? entries[0].timestamp : new Date().toISOString()
      }
    }
  }

  // Helper methods
  private mapRiskLevelToSeverity(riskLevel: string): 'info' | 'warning' | 'error' | 'critical' {
    switch (riskLevel) {
      case 'low': return 'info'
      case 'medium': return 'warning'
      case 'high': return 'error'
      case 'critical': return 'critical'
      default: return 'info'
    }
  }

  private determineDataAccessRiskLevel(
    action: string, 
    dataClassification: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (action === 'delete' && dataClassification === 'restricted') return 'critical'
    if (action === 'export' && (dataClassification === 'confidential' || dataClassification === 'restricted')) return 'high'
    if (action === 'update' && dataClassification === 'restricted') return 'high'
    if (dataClassification === 'restricted') return 'medium'
    if (dataClassification === 'confidential') return 'low'
    return 'low'
  }

  private mapActionToMethod(action: string): string {
    switch (action) {
      case 'read': return 'GET'
      case 'create': return 'POST'
      case 'update': return 'PUT'
      case 'delete': return 'DELETE'
      case 'export': return 'GET'
      default: return 'GET'
    }
  }
}

// Export singleton instance
export const auditTrailLogger = AuditTrailLogger.getInstance()
