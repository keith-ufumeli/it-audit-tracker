import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { auditTrailLogger } from "@/lib/audit-trail"

export async function auditTrailMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  try {
    // Skip logging for static assets and health checks
    const pathname = request.nextUrl.pathname
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/api/health') ||
      pathname.includes('.') ||
      pathname === '/api/auth/session' // Skip session checks to avoid infinite loops
    ) {
      return response
    }

    // Get user session
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token) {
      return response
    }

    const userId = token.sub || 'unknown'
    const userName = token.name || 'Unknown User'
    const userRole = token.role || 'guest'
    const sessionId = token.sub || 'unknown'

    // Determine action and resource from request
    const method = request.method
    const action = determineAction(method, pathname)
    const resource = determineResource(pathname)
    const resourceId = extractResourceId(pathname)
    const resourceType = determineResourceType(pathname)
    const dataClassification = determineDataClassification(pathname, method)
    const riskLevel = determineRiskLevel(method, pathname, dataClassification)
    const complianceRelevant = isComplianceRelevant(pathname, method)

    // Log the audit trail entry
    await auditTrailLogger.logEntry({
      userId,
      userName,
      userRole,
      sessionId,
      action,
      resource,
      resourceId,
      resourceType,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      endpoint: pathname,
      method,
      statusCode: response.status,
      riskLevel,
      complianceRelevant,
      dataClassification,
      description: `${method} request to ${pathname}`,
      metadata: {
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length'),
        acceptLanguage: request.headers.get('accept-language'),
        queryParams: Object.fromEntries(request.nextUrl.searchParams)
      },
      tags: generateTags(pathname, method, userRole)
    })

  } catch (error) {
    console.error('Audit trail middleware error:', error)
    // Don't fail the request if logging fails
  }

  return response
}

function determineAction(method: string, pathname: string): string {
  // Authentication actions
  if (pathname.includes('/auth/signin')) return 'login'
  if (pathname.includes('/auth/signout')) return 'logout'
  
  // API actions
  if (pathname.startsWith('/api/')) {
    switch (method) {
      case 'GET': return 'read'
      case 'POST': return 'create'
      case 'PUT': return 'update'
      case 'DELETE': return 'delete'
      case 'PATCH': return 'update'
      default: return method.toLowerCase()
    }
  }

  // Page access
  if (pathname.startsWith('/admin')) return 'admin_access'
  if (pathname.startsWith('/client')) return 'client_access'
  
  return `${method.toLowerCase()}_${pathname.replace(/\//g, '_')}`
}

function determineResource(pathname: string): string {
  if (pathname.includes('/documents')) return 'document'
  if (pathname.includes('/audits')) return 'audit'
  if (pathname.includes('/reports')) return 'report'
  if (pathname.includes('/activities')) return 'activity'
  if (pathname.includes('/notifications')) return 'notification'
  if (pathname.includes('/users')) return 'user'
  if (pathname.includes('/alerts')) return 'alert'
  if (pathname.includes('/audit-trail')) return 'audit_trail'
  if (pathname.startsWith('/admin')) return 'admin_portal'
  if (pathname.startsWith('/client')) return 'client_portal'
  if (pathname.startsWith('/api')) return 'api'
  if (pathname.includes('/auth')) return 'authentication'
  
  return 'page'
}

function extractResourceId(pathname: string): string | undefined {
  // Extract ID from URL patterns like /documents/123, /audits/456, etc.
  const idMatch = pathname.match(/\/([a-zA-Z]+)\/([a-zA-Z0-9-]+)$/)
  if (idMatch) {
    return idMatch[2]
  }

  return undefined
}

function determineResourceType(pathname: string): string {
  if (pathname.includes('/documents')) return 'document'
  if (pathname.includes('/audits')) return 'audit'
  if (pathname.includes('/reports')) return 'report'
  if (pathname.includes('/activities')) return 'activity'
  if (pathname.includes('/notifications')) return 'notification'
  if (pathname.includes('/users')) return 'user'
  if (pathname.includes('/alerts')) return 'alert'
  if (pathname.includes('/audit-trail')) return 'audit_trail'
  if (pathname.startsWith('/admin')) return 'admin_page'
  if (pathname.startsWith('/client')) return 'client_page'
  if (pathname.startsWith('/api')) return 'api_endpoint'
  if (pathname.includes('/auth')) return 'auth_endpoint'
  
  return 'web_page'
}

function determineDataClassification(pathname: string, method: string): 'public' | 'internal' | 'confidential' | 'restricted' {
  // Restricted data
  if (pathname.includes('/audit-trail') || 
      pathname.includes('/users') || 
      pathname.includes('/alerts')) {
    return 'restricted'
  }
  
  // Confidential data
  if (pathname.includes('/documents') || 
      pathname.includes('/audits') || 
      pathname.includes('/reports') ||
      pathname.includes('/notifications')) {
    return 'confidential'
  }
  
  // Internal data
  if (pathname.startsWith('/admin') || 
      pathname.startsWith('/client') ||
      pathname.startsWith('/api')) {
    return 'internal'
  }
  
  return 'public'
}

function determineRiskLevel(method: string, pathname: string, dataClassification: string): 'low' | 'medium' | 'high' | 'critical' {
  // Critical risk
  if (method === 'DELETE' && dataClassification === 'restricted') return 'critical'
  if (pathname.includes('/audit-trail') && method !== 'GET') return 'critical'
  
  // High risk
  if (method === 'DELETE' && dataClassification === 'confidential') return 'high'
  if (method === 'POST' && pathname.includes('/users')) return 'high'
  if (pathname.includes('/alerts')) return 'high'
  
  // Medium risk
  if (method === 'PUT' && dataClassification === 'confidential') return 'medium'
  if (method === 'POST' && dataClassification === 'confidential') return 'medium'
  
  return 'low'
}

function isComplianceRelevant(pathname: string, method: string): boolean {
  // All data access to sensitive resources is compliance relevant
  if (pathname.includes('/audit-trail') ||
      pathname.includes('/users') ||
      pathname.includes('/alerts') ||
      pathname.includes('/documents') ||
      pathname.includes('/audits') ||
      pathname.includes('/reports')) {
    return true
  }
  
  // All write operations are compliance relevant
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true
  }
  
  return false
}

function generateTags(pathname: string, method: string, userRole: string): string[] {
  const tags: string[] = []
  
  // Add method tag
  tags.push(method.toLowerCase())
  
  // Add resource tag
  if (pathname.includes('/documents')) tags.push('document')
  if (pathname.includes('/audits')) tags.push('audit')
  if (pathname.includes('/reports')) tags.push('report')
  if (pathname.includes('/users')) tags.push('user_management')
  if (pathname.includes('/alerts')) tags.push('security')
  if (pathname.includes('/audit-trail')) tags.push('compliance')
  
  // Add role tag
  tags.push(userRole)
  
  // Add portal tag
  if (pathname.startsWith('/admin')) tags.push('admin_portal')
  if (pathname.startsWith('/client')) tags.push('client_portal')
  
  return tags
}
