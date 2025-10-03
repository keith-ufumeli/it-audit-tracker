import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { errorHandler } from "@/lib/error-handler"

export async function apiErrorHandler(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    // Get user context for error logging
    let userContext = {}
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      })
      
      if (token) {
        userContext = {
          userId: token.sub,
          userName: token.name,
          userRole: token.role,
          sessionId: token.sub
        }
      }
    } catch (tokenError) {
      // Ignore token errors in error handling
    }

    // Create error context
    const errorContext = {
      ...userContext,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      endpoint: request.nextUrl.pathname,
      method: request.method,
      requestId: request.headers.get('x-request-id') || 
                 `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      correlationId: request.headers.get('x-correlation-id') || undefined,
      metadata: {
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length'),
        queryParams: Object.fromEntries(request.nextUrl.searchParams)
      }
    }

    // Handle the error
    const errorResponse = errorHandler.handleApiError(error, errorContext)

    // Add request ID to response headers
    const response = NextResponse.json(errorResponse, { 
      status: getStatusCodeFromError(error) 
    })
    
    response.headers.set('x-request-id', errorContext.requestId)
    response.headers.set('x-error-code', errorResponse.error.code)
    
    return response
  }
}

// Helper function to determine HTTP status code from error
function getStatusCodeFromError(error: any): number {
  if (error && typeof error === 'object') {
    // Check for custom status code
    if (error.status || error.statusCode) {
      return error.status || error.statusCode
    }
    
    // Check for specific error types
    if (error.code) {
      switch (error.code) {
        case 'VALIDATION_ERROR':
          return 400
        case 'AUTHENTICATION_ERROR':
          return 401
        case 'AUTHORIZATION_ERROR':
          return 403
        case 'NOT_FOUND':
          return 404
        case 'CONFLICT':
          return 409
        case 'RATE_LIMIT_EXCEEDED':
          return 429
        case 'DATABASE_ERROR':
          return 500
        case 'NETWORK_ERROR':
          return 502
        case 'SERVICE_UNAVAILABLE':
          return 503
        default:
          return 500
      }
    }
  }
  
  // Default to 500 for unknown errors
  return 500
}

// Wrapper function for API routes
export function withApiErrorHandler(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    return apiErrorHandler(request, () => handler(request))
  }
}

// Validation helper
export function validateRequest(
  request: NextRequest,
  requiredFields: string[] = [],
  requiredHeaders: string[] = []
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check required headers
  for (const header of requiredHeaders) {
    if (!request.headers.get(header)) {
      errors.push(`Missing required header: ${header}`)
    }
  }
  
  // Check content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      errors.push('Content-Type must be application/json')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1'
  
  const now = Date.now()
  const key = `${ip}:${request.nextUrl.pathname}`
  
  const current = rateLimitMap.get(key)
  
  if (!current || now > current.resetTime) {
    // Reset or create new entry
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs
    }
  }
  
  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    }
  }
  
  // Increment count
  current.count++
  rateLimitMap.set(key, current)
  
  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime
  }
}

// Request logging helper
export function logRequest(
  request: NextRequest,
  response: NextResponse,
  duration: number
): void {
  const logData = {
    method: request.method,
    url: request.nextUrl.pathname,
    status: response.status,
    duration,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        '127.0.0.1',
    timestamp: new Date().toISOString()
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const statusColor = response.status >= 400 ? '\x1b[31m' : // red
                       response.status >= 300 ? '\x1b[33m' : // yellow
                       '\x1b[32m' // green
    
    console.log(
      `${statusColor}${request.method} ${request.nextUrl.pathname} ${response.status}\x1b[0m - ${duration}ms`
    )
  }
  
  // In production, this would log to a proper logging service
}
