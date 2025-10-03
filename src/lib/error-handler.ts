// Comprehensive Error Handling and Logging System
// Provides centralized error handling, logging, and monitoring

import { auditTrailLogger } from './audit-trail'

export interface ErrorContext {
  userId?: string
  userName?: string
  userRole?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  endpoint?: string
  method?: string
  requestId?: string
  correlationId?: string
  metadata?: Record<string, any>
}

export interface ErrorDetails {
  message: string
  code: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'validation' | 'authentication' | 'authorization' | 'database' | 'network' | 'system' | 'business' | 'security'
  stack?: string
  timestamp: string
  context: ErrorContext
  retryable: boolean
  userFriendly: boolean
  complianceRelevant: boolean
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: string
    requestId?: string
    timestamp: string
    retryable: boolean
  }
  data?: null
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorCounts: Map<string, number> = new Map()
  private errorThresholds: Map<string, number> = new Map()

  private constructor() {
    // Set error thresholds for alerting
    this.errorThresholds.set('critical', 1)
    this.errorThresholds.set('high', 5)
    this.errorThresholds.set('medium', 20)
    this.errorThresholds.set('low', 100)
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // Create a standardized error
  public createError(
    message: string,
    code: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    category: 'validation' | 'authentication' | 'authorization' | 'database' | 'network' | 'system' | 'business' | 'security' = 'system',
    context: ErrorContext = {},
    retryable: boolean = false,
    userFriendly: boolean = true,
    complianceRelevant: boolean = false
  ): ErrorDetails {
    const error: ErrorDetails = {
      message,
      code,
      severity,
      category,
      stack: new Error().stack,
      timestamp: new Date().toISOString(),
      context,
      retryable,
      userFriendly,
      complianceRelevant
    }

    // Log the error
    this.logError(error)

    return error
  }

  // Log error details
  private async logError(error: ErrorDetails): Promise<void> {
    try {
      // Increment error count
      const errorKey = `${error.category}:${error.code}`
      const currentCount = this.errorCounts.get(errorKey) || 0
      this.errorCounts.set(errorKey, currentCount + 1)

      // Check if we should trigger an alert
      const threshold = this.errorThresholds.get(error.severity) || 100
      if (currentCount + 1 >= threshold) {
        await this.triggerErrorAlert(error, currentCount + 1)
      }

      // Log to audit trail if compliance relevant or high severity
      if (error.complianceRelevant || error.severity === 'high' || error.severity === 'critical') {
        await auditTrailLogger.logSecurityEvent(
          error.context.userId || 'system',
          error.context.userName || 'System',
          error.context.userRole || 'system',
          'error_occurred',
          error.category,
          error.severity,
          error.context.ipAddress || '127.0.0.1',
          error.context.userAgent || 'Unknown',
          error.context.sessionId || 'system',
          {
            errorCode: error.code,
            errorMessage: error.message,
            stack: error.stack,
            retryable: error.retryable,
            userFriendly: error.userFriendly,
            requestId: error.context.requestId,
            correlationId: error.context.correlationId,
            metadata: error.context.metadata
          }
        )
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`[ERROR HANDLER] ${error.severity.toUpperCase()}: ${error.message}`, {
          code: error.code,
          category: error.category,
          context: error.context,
          stack: error.stack
        })
      }

    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  // Trigger error alert
  private async triggerErrorAlert(error: ErrorDetails, count: number): Promise<void> {
    try {
      // In a real system, this would send alerts to monitoring systems
      console.warn(`[ERROR ALERT] ${error.severity.toUpperCase()} error threshold exceeded:`, {
        error: error.code,
        count,
        threshold: this.errorThresholds.get(error.severity),
        message: error.message
      })

      // Log critical alerts to audit trail
      if (error.severity === 'critical') {
        await auditTrailLogger.logSecurityEvent(
          'system',
          'System',
          'system',
          'critical_error_alert',
          'error_monitoring',
          'critical',
          '127.0.0.1',
          'System',
          'system',
          {
            errorCode: error.code,
            errorMessage: error.message,
            errorCount: count,
            threshold: this.errorThresholds.get(error.severity),
            category: error.category
          }
        )
      }
    } catch (alertError) {
      console.error('Failed to trigger error alert:', alertError)
    }
  }

  // Handle API errors
  public handleApiError(
    error: any,
    context: ErrorContext = {}
  ): ErrorResponse {
    let errorDetails: ErrorDetails

    if (error instanceof Error) {
      // Standard Error object
      errorDetails = this.createError(
        error.message,
        'INTERNAL_ERROR',
        'high',
        'system',
        context,
        false,
        false,
        true
      )
    } else if (typeof error === 'string') {
      // String error
      errorDetails = this.createError(
        error,
        'UNKNOWN_ERROR',
        'medium',
        'system',
        context,
        false,
        true,
        false
      )
    } else if (error && typeof error === 'object') {
      // Custom error object
      errorDetails = this.createError(
        error.message || 'Unknown error occurred',
        error.code || 'CUSTOM_ERROR',
        error.severity || 'medium',
        error.category || 'system',
        { ...context, ...error.context },
        error.retryable || false,
        error.userFriendly !== false,
        error.complianceRelevant || false
      )
    } else {
      // Unknown error type
      errorDetails = this.createError(
        'An unexpected error occurred',
        'UNKNOWN_ERROR_TYPE',
        'high',
        'system',
        context,
        false,
        true,
        true
      )
    }

    return this.createErrorResponse(errorDetails)
  }

  // Create standardized error response
  private createErrorResponse(error: ErrorDetails): ErrorResponse {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.userFriendly ? error.message : 'An error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        requestId: error.context.requestId,
        timestamp: error.timestamp,
        retryable: error.retryable
      },
      data: null
    }
  }

  // Validation errors
  public createValidationError(
    message: string,
    field?: string,
    context: ErrorContext = {}
  ): ErrorDetails {
    return this.createError(
      message,
      'VALIDATION_ERROR',
      'low',
      'validation',
      { ...context, metadata: { ...context.metadata, field } },
      false,
      true,
      false
    )
  }

  // Authentication errors
  public createAuthError(
    message: string,
    context: ErrorContext = {}
  ): ErrorDetails {
    return this.createError(
      message,
      'AUTHENTICATION_ERROR',
      'high',
      'authentication',
      context,
      false,
      true,
      true
    )
  }

  // Authorization errors
  public createAuthzError(
    message: string,
    context: ErrorContext = {}
  ): ErrorDetails {
    return this.createError(
      message,
      'AUTHORIZATION_ERROR',
      'high',
      'authorization',
      context,
      false,
      true,
      true
    )
  }

  // Database errors
  public createDatabaseError(
    message: string,
    operation?: string,
    context: ErrorContext = {}
  ): ErrorDetails {
    return this.createError(
      message,
      'DATABASE_ERROR',
      'high',
      'database',
      { ...context, metadata: { ...context.metadata, operation } },
      true,
      false,
      true
    )
  }

  // Network errors
  public createNetworkError(
    message: string,
    endpoint?: string,
    context: ErrorContext = {}
  ): ErrorDetails {
    return this.createError(
      message,
      'NETWORK_ERROR',
      'medium',
      'network',
      { ...context, endpoint },
      true,
      true,
      false
    )
  }

  // Business logic errors
  public createBusinessError(
    message: string,
    rule?: string,
    context: ErrorContext = {}
  ): ErrorDetails {
    return this.createError(
      message,
      'BUSINESS_ERROR',
      'medium',
      'business',
      { ...context, metadata: { ...context.metadata, rule } },
      false,
      true,
      false
    )
  }

  // Security errors
  public createSecurityError(
    message: string,
    threat?: string,
    context: ErrorContext = {}
  ): ErrorDetails {
    return this.createError(
      message,
      'SECURITY_ERROR',
      'critical',
      'security',
      { ...context, metadata: { ...context.metadata, threat } },
      false,
      false,
      true
    )
  }

  // Get error statistics
  public getErrorStats(): {
    totalErrors: number
    errorsByCategory: Record<string, number>
    errorsBySeverity: Record<string, number>
    topErrors: Array<{ code: string; count: number }>
  } {
    const errorsByCategory: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}
    let totalErrors = 0

    for (const [errorKey, count] of this.errorCounts.entries()) {
      const [category] = errorKey.split(':')
      errorsByCategory[category] = (errorsByCategory[category] || 0) + count
      totalErrors += count
    }

    const topErrors = Array.from(this.errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      topErrors
    }
  }

  // Reset error counts (for testing or maintenance)
  public resetErrorCounts(): void {
    this.errorCounts.clear()
  }

  // Set error threshold
  public setErrorThreshold(severity: string, threshold: number): void {
    this.errorThresholds.set(severity, threshold)
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Utility functions for common error scenarios
export const handleApiError = (error: any, context?: ErrorContext) => 
  errorHandler.handleApiError(error, context)

export const createValidationError = (message: string, field?: string, context?: ErrorContext) =>
  errorHandler.createValidationError(message, field, context)

export const createAuthError = (message: string, context?: ErrorContext) =>
  errorHandler.createAuthError(message, context)

export const createAuthzError = (message: string, context?: ErrorContext) =>
  errorHandler.createAuthzError(message, context)

export const createDatabaseError = (message: string, operation?: string, context?: ErrorContext) =>
  errorHandler.createDatabaseError(message, operation, context)

export const createNetworkError = (message: string, endpoint?: string, context?: ErrorContext) =>
  errorHandler.createNetworkError(message, endpoint, context)

export const createBusinessError = (message: string, rule?: string, context?: ErrorContext) =>
  errorHandler.createBusinessError(message, rule, context)

export const createSecurityError = (message: string, threat?: string, context?: ErrorContext) =>
  errorHandler.createSecurityError(message, threat, context)
