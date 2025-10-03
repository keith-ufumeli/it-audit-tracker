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

    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '50')

    let alerts = Database.getAlerts()

    // Apply filters
    if (status) {
      alerts = alerts.filter(alert => alert.status === status)
    }

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity)
    }

    // Sort by triggered date (newest first)
    alerts = alerts.sort((a, b) => 
      new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    )

    // Apply limit
    alerts = alerts.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length
    })
  } catch (error) {
    console.error("Error fetching alerts:", error)
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
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
    const { action, alertId } = body

    if (!action || !alertId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let success = false

    switch (action) {
      case 'acknowledge':
        success = Database.acknowledgeAlert(alertId, session.user.id)
        break
      case 'resolve':
        success = Database.resolveAlert(alertId, session.user.id)
        break
      case 'dismiss':
        success = Database.dismissAlert(alertId)
        break
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update alert" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Alert ${action}d successfully`
    })
  } catch (error) {
    console.error("Error updating alert:", error)
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    )
  }
}
