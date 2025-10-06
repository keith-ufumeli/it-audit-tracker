import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isSuperAdmin, hasAdminAccess } from "@/lib/auth"
import { Database } from "@/lib/database"
import { PersistentDatabase } from "@/lib/persistent-database"
import { PermissionManager } from "@/lib/permission-manager"
import bcrypt from "bcryptjs"

const permissionManager = PermissionManager.getInstance()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view users
    if (!isSuperAdmin(session.user.role) && !permissionManager.hasPermission(session.user.role, "manage_users")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = await params
    const user = Database.getUserById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove password from response
    const { password: _, ...userResponse } = user as any

    return NextResponse.json({ user: userResponse })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can update users
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can update users" }, { status: 403 })
    }

    const { id } = await params
    const user = Database.getUserById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { email, name, role, department, permissions, password, isActive } = body

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
      }

      // Check if email is already taken by another user
      const existingUser = Database.getUserByEmail(email)
      if (existingUser && existingUser.id !== id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 })
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ["super_admin", "audit_manager", "auditor", "management", "client", "department"]
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (role) updateData.role = role
    if (department !== undefined) updateData.department = department
    if (permissions) updateData.permissions = permissions
    if (isActive !== undefined) updateData.isActive = isActive

    // Handle password update
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await PersistentDatabase.updateUser(id, updateData)

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Log the activity with persistence
    await PersistentDatabase.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "update_user",
      description: `Updated user: ${user.name} (${user.email})`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "user_management",
      metadata: {
        targetUserId: user.id,
        targetUserEmail: user.email,
        changes: Object.keys(updateData)
      }
    })

    // Get updated user data
    const updatedUserData = Database.getUserById(id)
    
    // Remove password from response
    const { password: _, ...userResponse } = updatedUserData as any

    return NextResponse.json({ user: userResponse })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can delete users
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can delete users" }, { status: 403 })
    }

    const { id } = await params
    const user = Database.getUserById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent self-deletion
    if (user.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Prevent deletion of other Super Admins (only if there's more than one)
    if (user.role === "super_admin") {
      const allUsers = Database.getUsers()
      const superAdmins = allUsers.filter(u => u.role === "super_admin" && u.isActive)
      if (superAdmins.length <= 1) {
        return NextResponse.json({ error: "Cannot delete the last Super Admin" }, { status: 400 })
      }
    }

    // Mark user as inactive instead of deleting (since deleteUser doesn't exist in Database)
    const updated = await PersistentDatabase.updateUser(id, { isActive: false })
    if (!updated) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    // Log the activity with persistence
    await PersistentDatabase.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "delete_user",
      description: `Deleted user: ${user.name} (${user.email})`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "warning",
      resource: "user_management",
      metadata: {
        deletedUserId: user.id,
        deletedUserEmail: user.email,
        deletedUserRole: user.role
      }
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
