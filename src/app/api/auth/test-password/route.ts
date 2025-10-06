import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Database } from "@/lib/database"
import { PersistentDatabase } from "@/lib/persistent-database"
import bcrypt from "bcryptjs"

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
    const { email, newPassword, testLogin } = body

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email and new password are required" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = Database.getUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password with persistence
    const success = await PersistentDatabase.updateUser(user.id, { 
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    })

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    // Log the password change activity
    await PersistentDatabase.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "update_password",
      description: `Updated password for user: ${user.name} (${user.email})`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "warning",
      resource: "user_management",
      metadata: {
        targetUserId: user.id,
        targetUserEmail: user.email,
        changedBy: session.user.name
      }
    })

    const result: any = {
      success: true,
      message: "Password updated successfully",
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        updatedAt: new Date().toISOString()
      }
    }

    // If testLogin is requested, test the new password
    if (testLogin) {
      const updatedUser = Database.getUserById(user.id)
      if (updatedUser && updatedUser.password) {
        const isValidPassword = await bcrypt.compare(newPassword, updatedUser.password)
        result.data.passwordTest = {
          isValid: isValidPassword,
          message: isValidPassword ? "New password works correctly" : "New password verification failed"
        }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error testing password update:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to test password update",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = Database.getUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        hasPassword: !!user.password,
        lastUpdated: user.updatedAt,
        isActive: user.isActive
      }
    })
  } catch (error) {
    console.error("Error getting user password info:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get user password info",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
