import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isSuperAdmin } from "@/lib/auth"
import { PermissionManager } from "@/lib/permission-manager"
import { Database } from "@/lib/database"

const permissionManager = PermissionManager.getInstance()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can view permissions
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can view permissions" }, { status: 403 })
    }

    const permissions = permissionManager.getAllPermissions()
    const categories = permissionManager.getPermissionCategories()

    return NextResponse.json({ 
      permissions,
      categories
    })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can create permissions
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can create permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, category, isSystemPermission } = body

    // Validate required fields
    if (!id || !name || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate permission structure
    const permission = { id, name, description, category, isSystemPermission: isSystemPermission || false }
    const validationErrors = permissionManager.validatePermissionStructure(permission)
    
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 })
    }

    const success = permissionManager.addPermission(permission)
    if (!success) {
      return NextResponse.json({ error: "Permission already exists" }, { status: 409 })
    }

    // Log the activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "create_permission",
      description: `Created permission: ${name} (${id})`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "permission_management",
      metadata: {
        permissionId: id,
        permissionName: name,
        category: category
      }
    })

    return NextResponse.json({ permission }, { status: 201 })
  } catch (error) {
    console.error("Error creating permission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
