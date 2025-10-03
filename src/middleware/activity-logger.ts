import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { activityLogger } from "@/lib/activity-logger"

export async function activityLoggingMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  try {
    // Get user session
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // Skip logging for static assets and health checks
    const pathname = request.nextUrl.pathname
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/api/health') ||
      pathname.includes('.')
    ) {
      return response
    }

    // Determine user info
    const userId = token?.sub || 'anonymous'
    const userName = token?.name || 'Anonymous User'
    const userRole = token?.role || 'guest'

    // Determine action and resource based on request
    const action = determineAction(request)
    const resource = determineResource(request)
    const resourceId = extractResourceId(request)

    // Log the activity
    await activityLogger.logRequest(
      request,
      response,
      userId,
      userName,
      userRole,
      action,
      resource,
      resourceId,
      {
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length'),
        userAgent: request.headers.get('user-agent'),
        acceptLanguage: request.headers.get('accept-language'),
        xForwardedFor: request.headers.get('x-forwarded-for'),
        xRealIp: request.headers.get('x-real-ip')
      }
    )

  } catch (error) {
    console.error('Activity logging middleware error:', error)
    // Don't fail the request if logging fails
  }

  return response
}

function determineAction(request: NextRequest): string {
  const method = request.method
  const pathname = request.nextUrl.pathname

  // Authentication actions
  if (pathname.includes('/auth/signin')) {
    return 'login_attempt'
  }
  if (pathname.includes('/auth/signout')) {
    return 'logout'
  }

  // Document actions
  if (pathname.includes('/documents')) {
    if (method === 'GET') return 'document_view'
    if (method === 'POST') return 'document_upload'
    if (method === 'PUT') return 'document_update'
    if (method === 'DELETE') return 'document_delete'
  }

  // Audit actions
  if (pathname.includes('/audits')) {
    if (method === 'GET') return 'audit_view'
    if (method === 'POST') return 'audit_create'
    if (method === 'PUT') return 'audit_update'
    if (method === 'DELETE') return 'audit_delete'
  }

  // Report actions
  if (pathname.includes('/reports')) {
    if (method === 'GET') return 'report_view'
    if (method === 'POST') return 'report_create'
    if (method === 'PUT') return 'report_update'
  }

  // Activity/Log actions
  if (pathname.includes('/activities')) {
    return 'activity_view'
  }

  // Notification actions
  if (pathname.includes('/notifications')) {
    if (method === 'GET') return 'notification_view'
    if (method === 'PUT') return 'notification_update'
  }

  // Admin actions
  if (pathname.startsWith('/admin')) {
    return 'admin_access'
  }

  // Client actions
  if (pathname.startsWith('/client')) {
    return 'client_access'
  }

  // API actions
  if (pathname.startsWith('/api')) {
    return `api_${method.toLowerCase()}`
  }

  // Default action
  return `${method.toLowerCase()}_${pathname.replace(/\//g, '_')}`
}

function determineResource(request: NextRequest): string {
  const pathname = request.nextUrl.pathname

  if (pathname.includes('/documents')) return 'document'
  if (pathname.includes('/audits')) return 'audit'
  if (pathname.includes('/reports')) return 'report'
  if (pathname.includes('/activities')) return 'activity'
  if (pathname.includes('/notifications')) return 'notification'
  if (pathname.includes('/users')) return 'user'
  if (pathname.startsWith('/admin')) return 'admin_portal'
  if (pathname.startsWith('/client')) return 'client_portal'
  if (pathname.startsWith('/api')) return 'api'
  if (pathname.includes('/auth')) return 'authentication'

  return 'page'
}

function extractResourceId(request: NextRequest): string | undefined {
  const pathname = request.nextUrl.pathname
  
  // Extract ID from URL patterns like /documents/123, /audits/456, etc.
  const idMatch = pathname.match(/\/([a-zA-Z]+)\/([a-zA-Z0-9-]+)$/)
  if (idMatch) {
    return idMatch[2]
  }

  // Extract ID from query parameters
  const id = request.nextUrl.searchParams.get('id')
  if (id) {
    return id
  }

  return undefined
}

// Enhanced logging for specific security events
export async function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  request: NextRequest,
  userId?: string,
  userName?: string,
  userRole?: string
) {
  await activityLogger.logActivity({
    userId: userId || 'system',
    userName: userName || 'System',
    userRole: userRole || 'system',
    action: event,
    description: `Security event: ${event}`,
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'Unknown',
    severity: 'critical',
    resource: 'security',
    metadata: {
      ...details,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      timestamp: new Date().toISOString()
    }
  })
}

// Log failed authentication attempts
export async function logFailedAuth(
  email: string,
  reason: string,
  request: NextRequest
) {
  await activityLogger.logActivity({
    userId: 'anonymous',
    userName: email,
    userRole: 'guest',
    action: 'login_failed',
    description: `Failed login attempt for ${email}: ${reason}`,
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'Unknown',
    severity: 'warning',
    resource: 'authentication',
    metadata: {
      email,
      reason,
      endpoint: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    }
  })
}

// Log successful authentication
export async function logSuccessfulAuth(
  userId: string,
  userName: string,
  userRole: string,
  request: NextRequest
) {
  await activityLogger.logActivity({
    userId,
    userName,
    userRole,
    action: 'login_success',
    description: `Successful login for ${userName}`,
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'Unknown',
    severity: 'info',
    resource: 'authentication',
    metadata: {
      endpoint: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    }
  })
}
