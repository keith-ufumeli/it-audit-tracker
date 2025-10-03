import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { reportScheduler } from "@/lib/report-scheduler"

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

    const scheduledReports = reportScheduler.getScheduledReports()
    const reportJobs = reportScheduler.getReportJobs()

    return NextResponse.json({
      success: true,
      data: {
        scheduledReports,
        reportJobs: reportJobs.slice(-50) // Last 50 jobs
      }
    })
  } catch (error) {
    console.error("Error fetching scheduled reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch scheduled reports" },
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

    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, reportType, exportFormat, schedule, config, recipients } = body

    if (!name || !reportType || !exportFormat || !schedule || !config || !recipients) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const scheduledReport = reportScheduler.createScheduledReport({
      name,
      description,
      reportType,
      exportFormat,
      schedule,
      config,
      recipients,
      isActive: true,
      createdBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: scheduledReport
    })
  } catch (error) {
    console.error("Error creating scheduled report:", error)
    return NextResponse.json(
      { error: "Failed to create scheduled report" },
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

    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, updates } = body

    if (!id || !updates) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const success = reportScheduler.updateScheduledReport(id, updates)

    if (!success) {
      return NextResponse.json(
        { error: "Scheduled report not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Scheduled report updated successfully"
    })
  } catch (error) {
    console.error("Error updating scheduled report:", error)
    return NextResponse.json(
      { error: "Failed to update scheduled report" },
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

    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      )
    }

    const success = reportScheduler.deleteScheduledReport(id)

    if (!success) {
      return NextResponse.json(
        { error: "Scheduled report not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Scheduled report deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting scheduled report:", error)
    return NextResponse.json(
      { error: "Failed to delete scheduled report" },
      { status: 500 }
    )
  }
}
