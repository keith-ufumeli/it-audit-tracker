import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isSuperAdmin, hasAdminAccess } from "@/lib/auth"
import { Database } from "@/lib/database"
import { PermissionManager } from "@/lib/permission-manager"
import { checkPermissions } from "@/lib/permission-middleware"
import bcrypt from "bcryptjs"

const permissionManager = PermissionManager.getInstance()

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await checkPermissions(request, {
      requiredPermissions: ["manage_users"],
      allowSuperAdmin: true
    })

    if (!permissionCheck.allowed) {
      return permissionCheck.error!
    }

    const session = permissionCheck.session

    const users = Database.getUsers()
    
    // Filter out sensitive information for non-super admins
    const filteredUsers = users.map(user => {
      if (isSuperAdmin(session.user.role)) {
        return user // Super admin sees all data
      } else {
        // Other admins see limited data
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: filteredUsers 
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await checkPermissions(request, {
      allowSuperAdmin: true
    })

    if (!permissionCheck.allowed) {
      return permissionCheck.error!
    }

    const session = permissionCheck.session

    // Only Super Admin can create users
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can create users" }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, role, department, permissions, password } = body

    // Validate required fields
    if (!email || !name || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = Database.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Validate role
    const validRoles = ["super_admin", "audit_manager", "auditor", "management", "client", "department"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      role,
      department: department || "",
      permissions: permissions || permissionManager.getRolePermissions(role as any),
      password: hashedPassword, // In production, this should be stored securely
      createdAt: new Date().toISOString(),
      lastLogin: "",
      isActive: true
    }

    // Add user to database
    const { InMemoryDatabase } = await import("@/lib/database")
    InMemoryDatabase.users.push(newUser)
    const createdUser = newUser

    // Log the activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "create_user",
      description: `Created user: ${name} (${email}) with role: ${role}`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "user_management",
      metadata: {
        targetUserId: createdUser.id,
        targetUserEmail: createdUser.email,
        targetUserRole: createdUser.role
      }
    })

    // Remove password from response
    const { password: _, ...userResponse } = createdUser

    return NextResponse.json({ user: userResponse }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}