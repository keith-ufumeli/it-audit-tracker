import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isSuperAdmin } from "@/lib/auth"
import { PermissionManager } from "@/lib/permission-manager"
import { Database } from "@/lib/database"

const permissionManager = PermissionManager.getInstance()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can view permissions
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can view permissions" }, { status: 403 })
    }

    const permission = permissionManager.getPermissionById(params.id)
    if (!permission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 })
    }

    return NextResponse.json({ permission })
  } catch (error) {
    console.error("Error fetching permission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can update permissions
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can update permissions" }, { status: 403 })
    }

    const existingPermission = permissionManager.getPermissionById(params.id)
    if (!existingPermission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 })
    }

    // Prevent modification of system permissions
    if (existingPermission.isSystemPermission) {
      return NextResponse.json({ error: "Cannot modify system permissions" }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, category } = body

    // Validate required fields
    if (!name || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate permission structure
    const permission = { 
      id: params.id, 
      name, 
      description, 
      category, 
      isSystemPermission: existingPermission.isSystemPermission 
    }
    const validationErrors = permissionManager.validatePermissionStructure(permission)
    
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 })
    }

    const success = permissionManager.updatePermission(permission)
    if (!success) {
      return NextResponse.json({ error: "Failed to update permission" }, { status: 500 })
    }

    // Log the activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "update_permission",
      description: `Updated permission: ${name} (${params.id})`,
      timestamp: new Date().toISOString(),
      ipAddress: request.ip || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "permission_management",
      metadata: {
        permissionId: params.id,
        permissionName: name,
        category: category
      }
    })

    return NextResponse.json({ permission })
  } catch (error) {
    console.error("Error updating permission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can delete permissions
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can delete permissions" }, { status: 403 })
    }

    const permission = permissionManager.getPermissionById(params.id)
    if (!permission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 })
    }

    // Prevent deletion of system permissions
    if (permission.isSystemPermission) {
      return NextResponse.json({ error: "Cannot delete system permissions" }, { status: 400 })
    }

    const success = permissionManager.deletePermission(params.id)
    if (!success) {
      return NextResponse.json({ error: "Failed to delete permission" }, { status: 500 })
    }

    // Log the activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "delete_permission",
      description: `Deleted permission: ${permission.name} (${params.id})`,
      timestamp: new Date().toISOString(),
      ipAddress: request.ip || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "warning",
      resource: "permission_management",
      metadata: {
        permissionId: params.id,
        permissionName: permission.name,
        category: permission.category
      }
    })

    return NextResponse.json({ message: "Permission deleted successfully" })
  } catch (error) {
    console.error("Error deleting permission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
