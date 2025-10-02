import { NextRequest, NextResponse } from "next/server"
import { Database } from "./database"

export interface ActivityLogEntry {
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
  resourceId?: string
  metadata?: Record<string, any>
  sessionId?: string
  endpoint?: string
  method?: string
  statusCode?: number
  responseTime?: number
}

export interface AlertRule {
  id: string
  name: string
  description: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  conditions: {
    action?: string
    resource?: string
    userRole?: string
    severity?: string
    timeWindow?: number // minutes
    threshold?: number // count within time window
  }
  isActive: boolean
  createdAt: string
  lastTriggered?: string
}

export class ActivityLogger {
  private static instance: ActivityLogger
  private alertRules: AlertRule[] = []
  private websocketClients: Set<any> = new Set()

  private constructor() {
    this.initializeDefaultAlertRules()
  }

  public static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger()
    }
    return ActivityLogger.instance
  }

  private initializeDefaultAlertRules() {
    this.alertRules = [
      {
        id: 'rule-001',
        name: 'Multiple Failed Login Attempts',
        description: 'Alert when user has multiple failed login attempts',
        severity: 'error',
        conditions: {
          action: 'login_failed',
          timeWindow: 15,
          threshold: 3
        },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule-002',
        name: 'Suspicious Document Access',
        description: 'Alert when user accesses multiple confidential documents',
        severity: 'warning',
        conditions: {
          resource: 'document',
          timeWindow: 30,
          threshold: 5
        },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule-003',
        name: 'Admin Privilege Escalation',
        description: 'Alert when non-admin user attempts admin actions',
        severity: 'critical',
        conditions: {
          userRole: 'client',
          action: 'admin_action'
        },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule-004',
        name: 'Unusual Activity Pattern',
        description: 'Alert when user performs unusual number of actions',
        severity: 'warning',
        conditions: {
          timeWindow: 60,
          threshold: 20
        },
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]
  }

  public logActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): string {
    const activityId = `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const fullEntry: ActivityLogEntry = {
      ...entry,
      id: activityId,
      timestamp: new Date().toISOString()
    }

    // Store in database
    Database.addActivity({
      ...fullEntry,
      metadata: fullEntry.metadata || {}
    })

    // Check for alerts
    this.checkAlertRules(fullEntry)

    return activityId
  }

  public logRequest(
    request: NextRequest,
    response: NextResponse,
    userId?: string,
    userName?: string,
    userRole?: string,
    action?: string,
    resource?: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): string {
    const startTime = Date.now()
    const responseTime = Date.now() - startTime

    return this.logActivity({
      userId: userId || 'anonymous',
      userName: userName || 'Anonymous User',
      userRole: userRole || 'guest',
      action: action || `${request.method} ${request.nextUrl.pathname}`,
      description: `${request.method} request to ${request.nextUrl.pathname}`,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      severity: this.determineSeverity(request, response),
      resource: resource || 'api',
      resourceId,
      metadata: {
        ...metadata,
        method: request.method,
        endpoint: request.nextUrl.pathname,
        statusCode: response.status,
        responseTime
      },
      endpoint: request.nextUrl.pathname,
      method: request.method,
      statusCode: response.status,
      responseTime
    })
  }

  private determineSeverity(request: NextRequest, response: NextResponse): 'info' | 'warning' | 'error' | 'critical' {
    // Critical: Admin actions, security-related endpoints
    if (request.nextUrl.pathname.startsWith('/admin') || 
        request.nextUrl.pathname.includes('auth') ||
        request.nextUrl.pathname.includes('upload')) {
      return 'critical'
    }

    // High: API endpoints, data modifications
    if (request.nextUrl.pathname.startsWith('/api') || 
        ['POST', 'PUT', 'DELETE'].includes(request.method)) {
      return 'error'
    }

    // Medium: Data access
    if (request.method === 'GET' && request.nextUrl.pathname.startsWith('/api')) {
      return 'warning'
    }

    // Low: Static content, general browsing
    return 'info'
  }

  private checkAlertRules(entry: ActivityLogEntry) {
    for (const rule of this.alertRules) {
      if (!rule.isActive) continue

      if (this.evaluateRule(rule, entry)) {
        this.triggerAlert(rule, entry)
      }
    }
  }

  private evaluateRule(rule: AlertRule, entry: ActivityLogEntry): boolean {
    const { conditions } = rule

    // Check basic conditions
    if (conditions.action && entry.action !== conditions.action) return false
    if (conditions.resource && entry.resource !== conditions.resource) return false
    if (conditions.userRole && entry.userRole !== conditions.userRole) return false
    if (conditions.severity && entry.severity !== conditions.severity) return false

    // Check time-based conditions
    if (conditions.timeWindow && conditions.threshold) {
      const timeWindow = conditions.timeWindow * 60 * 1000 // Convert to milliseconds
      const cutoffTime = new Date(Date.now() - timeWindow).toISOString()
      
      const recentActivities = Database.getActivities().filter(activity => 
        activity.userId === entry.userId &&
        activity.timestamp >= cutoffTime &&
        this.matchesBasicConditions(activity, conditions)
      )

      if (recentActivities.length >= conditions.threshold) {
        return true
      }
    }

    return false
  }

  private matchesBasicConditions(activity: any, conditions: AlertRule['conditions']): boolean {
    if (conditions.action && activity.action !== conditions.action) return false
    if (conditions.resource && activity.resource !== conditions.resource) return false
    if (conditions.userRole && activity.userRole !== conditions.userRole) return false
    if (conditions.severity && activity.severity !== conditions.severity) return false
    return true
  }

  private triggerAlert(rule: AlertRule, entry: ActivityLogEntry) {
    // Update rule last triggered
    rule.lastTriggered = new Date().toISOString()

    // Create alert notification
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      description: rule.description,
      triggeredBy: entry.userId,
      triggeredByName: entry.userName,
      triggeredAt: new Date().toISOString(),
      status: 'active' as const,
      metadata: {
        activityId: entry.id,
        activityDescription: entry.description,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent
      }
    }

    // Store alert
    Database.addAlert(alert)

    // Send real-time notification via WebSocket
    this.broadcastAlert(alert)

    // Create notification for admin users
    const adminUsers = Database.getUsers().filter(user => 
      ['audit_manager', 'auditor', 'management'].includes(user.role)
    )

    adminUsers.forEach(admin => {
      Database.addNotification({
        userId: admin.id,
        userName: admin.name,
        userRole: admin.role,
        title: `Security Alert: ${rule.name}`,
        message: `${rule.description} - Triggered by ${entry.userName}`,
        type: 'security_alert',
        priority: rule.severity as 'low' | 'medium' | 'high' | 'critical',
        metadata: {
          alertId: alert.id,
          ruleId: rule.id,
          activityId: entry.id
        }
      })
    })
  }

  public broadcastAlert(alert: any) {
    const message = JSON.stringify({
      type: 'alert',
      data: alert
    })

    this.websocketClients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN = 1
        client.send(message)
      }
    })
  }

  public addWebSocketClient(client: any) {
    this.websocketClients.add(client)
    
    client.on('close', () => {
      this.websocketClients.delete(client)
    })
  }

  public getAlertRules(): AlertRule[] {
    return this.alertRules
  }

  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId)
    if (ruleIndex === -1) return false

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates }
    return true
  }

  public getRecentActivities(limit: number = 100): ActivityLogEntry[] {
    return Database.getActivities()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  public getActivitiesByUser(userId: string, limit: number = 50): ActivityLogEntry[] {
    return Database.getActivities()
      .filter(activity => activity.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  public getActivitiesBySeverity(severity: string, limit: number = 50): ActivityLogEntry[] {
    return Database.getActivities()
      .filter(activity => activity.severity === severity)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }
}

export const activityLogger = ActivityLogger.getInstance()
