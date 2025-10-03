import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { errorHandler } from "@/lib/error-handler"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only super admin can access error monitoring
    if (session.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      )
    }

    const stats = errorHandler.getErrorStats()

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error("Error getting error monitoring stats:", error)
    return NextResponse.json(
      { error: "Failed to get error monitoring stats" },
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

    // Only super admin can manage error monitoring
    if (session.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'reset_counts':
        errorHandler.resetErrorCounts()
        return NextResponse.json({
          success: true,
          message: "Error counts reset successfully"
        })

      case 'set_threshold':
        const { severity, threshold } = body
        if (!severity || threshold === undefined) {
          return NextResponse.json(
            { error: "Missing required fields: severity, threshold" },
            { status: 400 }
          )
        }
        
        errorHandler.setErrorThreshold(severity, threshold)
        return NextResponse.json({
          success: true,
          message: `Error threshold for ${severity} set to ${threshold}`
        })

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error processing error monitoring request:", error)
    return NextResponse.json(
      { error: "Failed to process error monitoring request" },
      { status: 500 }
    )
  }
}
