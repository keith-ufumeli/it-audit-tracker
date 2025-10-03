import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PersistentDatabase } from "@/lib/persistent-database"
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

    // Check if user has admin access
    const adminRoles = ["audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Get file stats
    const fileStats = await PersistentDatabase.getFileStats()
    
    // Get current in-memory data
    const inMemoryData = {
      audits: Database.getAudits().length,
      users: Database.getUsers().length,
      documents: Database.getDocuments().length,
      activities: Database.getActivities().length,
      notifications: Database.getNotifications().length
    }

    return NextResponse.json({
      success: true,
      message: "Persistent database test completed",
      data: {
        fileStats,
        inMemoryData,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Error testing persistent database:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to test persistent database",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

    // Check if user has admin access
    const adminRoles = ["audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { testType } = body

    if (testType === "update_audit") {
      // Test updating an audit
      const audits = Database.getAudits()
      if (audits.length === 0) {
        return NextResponse.json({
          success: false,
          error: "No audits found to test with"
        })
      }

      const testAudit = audits[0]
      const testUpdate = {
        description: `Test update at ${new Date().toISOString()}`,
        progress: Math.floor(Math.random() * 100)
      }

      const success = await PersistentDatabase.updateAudit(testAudit.id, testUpdate)
      
      if (success) {
        const updatedAudit = Database.getAuditById(testAudit.id)
        return NextResponse.json({
          success: true,
          message: "Audit update test successful",
          data: {
            original: {
              id: testAudit.id,
              description: testAudit.description,
              progress: testAudit.progress
            },
            updated: {
              id: updatedAudit?.id,
              description: updatedAudit?.description,
              progress: updatedAudit?.progress
            },
            fileStats: await PersistentDatabase.getFileStats()
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: "Failed to update audit"
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: "Invalid test type"
    })
  } catch (error) {
    console.error("Error running persistent database test:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to run persistent database test",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
