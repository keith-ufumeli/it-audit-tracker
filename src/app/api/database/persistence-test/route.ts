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
    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
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
      message: "Persistence system status",
      data: {
        fileStats,
        inMemoryData,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Error testing persistence system:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to test persistence system",
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
    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
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

    if (testType === "create_user") {
      // Test creating a user
      const testUser = {
        id: `test-user-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
        role: "department" as const,
        department: "IT",
        permissions: ["view_documents"],
        password: "hashed_password_placeholder",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: "",
        isActive: true
      }

      const success = await PersistentDatabase.addUser(testUser)
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: "User creation test successful",
          data: {
            createdUser: {
              id: testUser.id,
              email: testUser.email,
              name: testUser.name,
              role: testUser.role
            },
            fileStats: await PersistentDatabase.getFileStats()
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: "Failed to create user"
        })
      }
    }

    if (testType === "sync_data") {
      // Test syncing data from files to memory
      await PersistentDatabase.syncFromFiles()
      
      return NextResponse.json({
        success: true,
        message: "Data sync test completed",
        data: {
          inMemoryData: {
            audits: Database.getAudits().length,
            users: Database.getUsers().length,
            documents: Database.getDocuments().length,
            activities: Database.getActivities().length,
            notifications: Database.getNotifications().length
          },
          fileStats: await PersistentDatabase.getFileStats()
        }
      })
    }

    if (testType === "backup_data") {
      // Test creating a backup
      const backupResult = await PersistentDatabase.backupData()
      
      return NextResponse.json({
        success: backupResult.success,
        message: backupResult.success ? "Backup test successful" : "Backup test failed",
        data: {
          backupResult,
          fileStats: await PersistentDatabase.getFileStats()
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: "Invalid test type. Supported types: update_audit, create_user, sync_data, backup_data"
    })
  } catch (error) {
    console.error("Error running persistence test:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to run persistence test",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
