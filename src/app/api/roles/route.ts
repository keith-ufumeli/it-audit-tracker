import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isSuperAdmin, UserRole } from "@/lib/auth"
import { PermissionManager } from "@/lib/permission-manager"
import { Database } from "@/lib/database"

const permissionManager = PermissionManager.getInstance()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can view role permissions
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can view role permissions" }, { status: 403 })
    }

    const roles: UserRole[] = ["super_admin", "audit_manager", "auditor", "management", "client", "department"]
    const rolePermissions = roles.map(role => ({
      role,
      permissions: permissionManager.getRolePermissions(role)
    }))

    return NextResponse.json({ rolePermissions })
  } catch (error) {
    console.error("Error fetching role permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can update role permissions
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can update role permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { role, permissions } = body

    // Validate role
    const validRoles: UserRole[] = ["super_admin", "audit_manager", "auditor", "management", "client", "department"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Prevent modification of Super Admin role permissions
    if (role === "super_admin") {
      return NextResponse.json({ error: "Cannot modify Super Admin role permissions" }, { status: 400 })
    }

    // Validate permissions
    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: "Permissions must be an array" }, { status: 400 })
    }

    // Validate that all permissions exist
    const allPermissions = permissionManager.getAllPermissions()
    const validPermissionIds = allPermissions.map(p => p.id)
    const invalidPermissions = permissions.filter((p: string) => !validPermissionIds.includes(p))
    
    if (invalidPermissions.length > 0) {
      return NextResponse.json({ 
        error: "Invalid permissions", 
        details: invalidPermissions 
      }, { status: 400 })
    }

    const success = permissionManager.updateRolePermissions(role, permissions)
    if (!success) {
      return NextResponse.json({ error: "Failed to update role permissions" }, { status: 500 })
    }

    // Log the activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "update_role_permissions",
      description: `Updated permissions for role: ${role}`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "permission_management",
      metadata: {
        role: role,
        permissionCount: permissions.length,
        permissions: permissions
      }
    })

    return NextResponse.json({ 
      message: "Role permissions updated successfully",
      role,
      permissions
    })
  } catch (error) {
    console.error("Error updating role permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
