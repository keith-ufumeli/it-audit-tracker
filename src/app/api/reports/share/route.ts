import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { reportSharingManager } from "@/lib/report-sharing"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const type = searchParams.get('type') || 'my-shares'

    if (token) {
      // Get shared report by token
      const sharedReport = reportSharingManager.getSharedReportByToken(token)
      if (!sharedReport) {
        return NextResponse.json(
          { error: "Shared report not found or expired" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: sharedReport
      })
    }

    // Get shared reports for user
    let sharedReports
    switch (type) {
      case 'my-shares':
        sharedReports = reportSharingManager.getSharedReportsByUser(session.user.id)
        break
      case 'shared-with-me':
        sharedReports = reportSharingManager.getSharedReportsForUser(session.user.id)
        break
      default:
        sharedReports = reportSharingManager.getSharedReportsByUser(session.user.id)
    }

    return NextResponse.json({
      success: true,
      data: sharedReports
    })
  } catch (error) {
    console.error("Error fetching shared reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch shared reports" },
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
    const { 
      reportData, 
      reportName, 
      reportType, 
      recipients, 
      accessLevel, 
      permissions, 
      metadata, 
      expiresAt, 
      createPublicLink 
    } = body

    if (!reportData || !reportName || !reportType || !recipients) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const sharedReport = reportSharingManager.shareReport(
      reportData,
      session.user.id,
      recipients,
      {
        reportName,
        reportType,
        accessLevel: accessLevel || 'view',
        permissions: permissions || {
          allowDownload: true,
          allowPrint: true,
          allowShare: false,
          requireAuthentication: true
        },
        metadata: metadata || {
          confidential: false
        },
        expiresAt,
        createPublicLink
      }
    )

    return NextResponse.json({
      success: true,
      data: sharedReport
    })
  } catch (error) {
    console.error("Error sharing report:", error)
    return NextResponse.json(
      { error: "Failed to share report" },
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
    const { action, sharedReportId, comment, linkId } = body

    if (!action || !sharedReportId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'revoke':
        result = reportSharingManager.revokeSharedReport(sharedReportId, session.user.id)
        break
      case 'add-comment':
        if (!comment) {
          return NextResponse.json(
            { error: "Comment is required" },
            { status: 400 }
          )
        }
        result = reportSharingManager.addComment(sharedReportId, session.user.id, comment)
        break
      case 'delete-link':
        if (!linkId) {
          return NextResponse.json(
            { error: "Link ID is required" },
            { status: 400 }
          )
        }
        result = reportSharingManager.deleteShareLink(linkId)
        break
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    if (result === false) {
      return NextResponse.json(
        { error: "Operation failed" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Operation completed successfully"
    })
  } catch (error) {
    console.error("Error updating shared report:", error)
    return NextResponse.json(
      { error: "Failed to update shared report" },
      { status: 500 }
    )
  }
}
