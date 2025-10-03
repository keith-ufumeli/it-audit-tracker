import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Database, InMemoryDatabase } from "@/lib/database"
import { PersistentDatabase } from "@/lib/persistent-database"

interface Report {
  id: string
  title: string
  auditId: string
  auditTitle: string
  reportType: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdBy: string
  createdByName: string
  createdAt: string
  submittedAt?: string
  approvedAt?: string
  approvedBy?: string
  content: string
  findings?: string[]
  recommendations?: string[]
}

// Reports are now stored in the Database class and loaded from JSON files

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Load data from files if in-memory database is empty
    if (InMemoryDatabase.reports.length === 0) {
      await InMemoryDatabase.loadDataFromFiles()
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const auditId = searchParams.get('auditId')

    let reports = Database.getReports()

    // Apply filters
    if (status) {
      reports = reports.filter(report => report.status === status)
    }

    if (auditId) {
      reports = reports.filter(report => report.auditId === auditId)
    }

    // Sort by created date (newest first)
    reports = reports.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      data: reports,
      count: reports.length
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
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
    if (!session.user.permissions.includes("submit_reports")) {
      return NextResponse.json(
        { error: "Forbidden - No permission to create reports" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, auditId, reportType, content, findings, recommendations } = body

    // Validation
    if (!title || !auditId || !reportType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify audit exists
    const audit = Database.getAuditById(auditId)
    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      )
    }

    // Create new report
    const newReport: Report = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      auditId,
      auditTitle: audit.title,
      reportType,
      status: 'draft',
      createdBy: session.user.id,
      createdByName: session.user.name,
      createdAt: new Date().toISOString(),
      content: content || '',
      findings: findings || [],
      recommendations: recommendations || []
    }

    // Add to database
    Database.addReport(newReport)

    // Log activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "create_report",
      description: `Created new report: ${title}`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "report",
      metadata: {
        reportId: newReport.id,
        reportTitle: title,
        auditId,
        auditTitle: audit.title,
        reportType
      }
    })

    return NextResponse.json({
      success: true,
      data: newReport,
      message: "Report created successfully"
    })
  } catch (error) {
    console.error("Error creating report:", error)
    return NextResponse.json(
      { error: "Failed to create report" },
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
    const { reportId, ...updates } = body

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      )
    }

    // Find report
    const report = Database.getReportById(reportId)
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }

    // Check if user can edit this report
    const canEdit = session.user.id === report.createdBy || 
                    session.user.permissions.includes("approve_reports")

    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden - No permission to edit this report" },
        { status: 403 }
      )
    }

    // Update report
    Database.updateReport(reportId, updates)

    // Log activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "update_report",
      description: `Updated report: ${report.title}`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "report",
      metadata: {
        reportId,
        reportTitle: report.title,
        updates: Object.keys(updates)
      }
    })

    return NextResponse.json({
      success: true,
      data: Database.getReportById(reportId),
      message: "Report updated successfully"
    })
  } catch (error) {
    console.error("Error updating report:", error)
    return NextResponse.json(
      { error: "Failed to update report" },
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
    const reportId = searchParams.get('id')

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      )
    }

    // Find report
    const report = Database.getReportById(reportId)
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }

    // Only creator or admin can delete
    if (session.user.id !== report.createdBy && !session.user.permissions.includes("create_audit")) {
      return NextResponse.json(
        { error: "Forbidden - No permission to delete this report" },
        { status: 403 }
      )
    }

    // Remove from database
    Database.deleteReport(reportId)

    // Log activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "delete_report",
      description: `Deleted report: ${report.title}`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "warning",
      resource: "report",
      metadata: {
        reportId,
        reportTitle: report.title
      }
    })

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting report:", error)
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    )
  }
}

