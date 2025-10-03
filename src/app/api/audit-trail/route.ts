import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { auditTrailLogger } from "@/lib/audit-trail"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only admin users can access audit trail
    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse filter parameters
    const filter = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resource: searchParams.get('resource') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined,
      complianceRelevant: searchParams.get('complianceRelevant') === 'true' ? true : 
                         searchParams.get('complianceRelevant') === 'false' ? false : undefined,
      dataClassification: searchParams.get('dataClassification') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    }

    const entries = await auditTrailLogger.getEntries(filter)
    const stats = auditTrailLogger.getStats()

    // Log this audit trail access
    await auditTrailLogger.logDataAccess(
      session.user.id,
      session.user.name,
      session.user.role,
      'audit_trail',
      'all',
      'audit_trail',
      'read',
      request.headers.get('x-forwarded-for') || '127.0.0.1',
      request.headers.get('user-agent') || 'Unknown',
      session.user.id, // Using user ID as session ID for now
      'restricted',
      { filter, entryCount: entries.length }
    )

    return NextResponse.json({
      success: true,
      data: entries,
      stats,
      count: entries.length,
      filter
    })
  } catch (error) {
    console.error("Error fetching audit trail:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit trail" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, resource, resourceId, resourceType, beforeState, afterState, metadata } = body

    // Validate required fields
    if (!action || !resource || !resourceType) {
      return NextResponse.json(
        { error: "Missing required fields: action, resource, resourceType" },
        { status: 400 }
      )
    }

    // Log the audit trail entry
    const entryId = await auditTrailLogger.logEntry({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      sessionId: session.user.id, // Using user ID as session ID for now
      action,
      resource,
      resourceId,
      resourceType,
      beforeState,
      afterState,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      endpoint: request.nextUrl.pathname,
      method: 'POST',
      statusCode: 200,
      riskLevel: 'medium',
      complianceRelevant: true,
      dataClassification: 'internal',
      description: `Manual audit trail entry: ${action} on ${resource}`,
      metadata: metadata || {},
      tags: ['manual_entry']
    })

    return NextResponse.json({
      success: true,
      data: { entryId },
      message: "Audit trail entry logged successfully"
    })
  } catch (error) {
    console.error("Error logging audit trail entry:", error)
    return NextResponse.json(
      { error: "Failed to log audit trail entry" },
      { status: 500 }
    )
  }
}
