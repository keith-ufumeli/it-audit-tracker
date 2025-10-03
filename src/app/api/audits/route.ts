import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Database } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const adminRoles = ["audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    let audits = Database.getAudits()

    // Apply filters
    if (status) {
      audits = audits.filter(audit => audit.status === status)
    }

    if (priority) {
      audits = audits.filter(audit => audit.priority === priority)
    }

    // Sort by created date (newest first)
    audits = audits.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      data: audits,
      count: audits.length
    })
  } catch (error) {
    console.error("Error fetching audits:", error)
    return NextResponse.json(
      { error: "Failed to fetch audits" },
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

    // Check permission
    if (!session.user.permissions.includes("create_audit")) {
      return NextResponse.json(
        { error: "Forbidden - No permission to create audits" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, startDate, endDate, priority, scope, complianceFrameworks, assignedAuditors } = body

    // Validation
    if (!title || !description || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create new audit
    const newAudit = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      status: 'planning' as const,
      priority: priority || 'medium',
      auditManager: session.user.id,
      assignedAuditors: assignedAuditors || [],
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scope: scope ? scope.split(',').map((s: string) => s.trim()) : [],
      complianceFrameworks: complianceFrameworks ? complianceFrameworks.split(',').map((f: string) => f.trim()) : [],
      findings: [],
      progress: 0
    }

    // Add to database
    const success = Database.addAudit(newAudit)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to create audit" },
        { status: 500 }
      )
    }

    // Log activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "create_audit",
      description: `Created new audit: ${title}`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "audit",
      metadata: {
        auditId: newAudit.id,
        auditTitle: title,
        priority: newAudit.priority,
        startDate,
        endDate
      }
    })

    // Send notifications to assigned auditors
    if (assignedAuditors && assignedAuditors.length > 0) {
      assignedAuditors.forEach((auditorId: string) => {
        Database.addNotification({
          userId: auditorId,
          userName: session.user.name,
          userRole: session.user.role,
          title: "New Audit Assignment",
          message: `You have been assigned to audit: ${title}`,
          type: "audit_assignment",
          priority: "medium",
          metadata: {
            auditId: newAudit.id,
            auditTitle: title,
            assignedBy: session.user.name,
            startDate,
            endDate
          }
        })
      })
    }

    return NextResponse.json({
      success: true,
      data: newAudit,
      message: "Audit created successfully"
    })
  } catch (error) {
    console.error("Error creating audit:", error)
    return NextResponse.json(
      { error: "Failed to create audit" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { auditId, ...updates } = body

    if (!auditId) {
      return NextResponse.json(
        { error: "Audit ID is required" },
        { status: 400 }
      )
    }

    // Get audit to check permissions
    const audit = Database.getAuditById(auditId)
    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      )
    }

    // Check if user can edit this audit
    const canEdit = session.user.id === audit.auditManager || 
                    session.user.permissions.includes("create_audit")

    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden - No permission to edit this audit" },
        { status: 403 }
      )
    }

    // Update audit
    const success = Database.updateAudit(auditId, updates)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update audit" },
        { status: 500 }
      )
    }

    // Log activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "update_audit",
      description: `Updated audit: ${audit.title}`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "audit",
      metadata: {
        auditId,
        auditTitle: audit.title,
        updates: Object.keys(updates)
      }
    })

    return NextResponse.json({
      success: true,
      data: Database.getAuditById(auditId),
      message: "Audit updated successfully"
    })
  } catch (error) {
    console.error("Error updating audit:", error)
    return NextResponse.json(
      { error: "Failed to update audit" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('id')

    if (!auditId) {
      return NextResponse.json(
        { error: "Audit ID is required" },
        { status: 400 }
      )
    }

    // Get audit to check permissions
    const audit = Database.getAuditById(auditId)
    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      )
    }

    // Only audit manager can delete
    if (!session.user.permissions.includes("create_audit")) {
      return NextResponse.json(
        { error: "Forbidden - No permission to delete audits" },
        { status: 403 }
      )
    }

    // Soft delete - mark as cancelled
    const success = Database.updateAudit(auditId, { status: 'cancelled' })

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete audit" },
        { status: 500 }
      )
    }

    // Log activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "delete_audit",
      description: `Cancelled audit: ${audit.title}`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "warning",
      resource: "audit",
      metadata: {
        auditId,
        auditTitle: audit.title
      }
    })

    return NextResponse.json({
      success: true,
      message: "Audit cancelled successfully"
    })
  } catch (error) {
    console.error("Error deleting audit:", error)
    return NextResponse.json(
      { error: "Failed to delete audit" },
      { status: 500 }
    )
  }
}

