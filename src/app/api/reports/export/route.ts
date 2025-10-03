import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { csvExporter } from "@/lib/csv-exporter"

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
    const { dataType, config } = body

    if (!dataType) {
      return NextResponse.json(
        { error: "Data type is required" },
        { status: 400 }
      )
    }

    const exportConfig = {
      dataType: dataType,
      dateRange: config?.dateRange,
      filters: config?.filters,
      includeMetadata: config?.includeMetadata || false
    }

    let csv
    switch (dataType) {
      case 'audits':
        csv = csvExporter.exportAudits(exportConfig)
        break
      case 'documents':
        csv = csvExporter.exportDocuments(exportConfig)
        break
      case 'activities':
        csv = csvExporter.exportActivities(exportConfig)
        break
      case 'alerts':
        csv = csvExporter.exportAlerts(exportConfig)
        break
      case 'users':
        csv = csvExporter.exportUsers(exportConfig)
        break
      case 'compliance':
        csv = csvExporter.exportComplianceSummary(exportConfig)
        break
      case 'findings':
        csv = csvExporter.exportAuditFindings(exportConfig)
        break
      default:
        return NextResponse.json(
          { error: "Invalid data type" },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: {
        csv,
        filename: `${dataType}-export-${new Date().toISOString().split('T')[0]}.csv`,
        mimeType: 'text/csv'
      }
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
