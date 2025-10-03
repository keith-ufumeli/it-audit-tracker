import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isSuperAdmin, hasAdminAccess } from "./auth"
import { PermissionManager } from "./permission-manager"

const permissionManager = PermissionManager.getInstance()

export interface PermissionCheckOptions {
  requiredPermissions?: string[]
  requiredRoles?: string[]
  allowSuperAdmin?: boolean
  allowAdminAccess?: boolean
}

export function withPermissionCheck(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: PermissionCheckOptions = {}
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { 
        requiredPermissions = [], 
        requiredRoles = [], 
        allowSuperAdmin = true,
        allowAdminAccess = false 
      } = options

      // Check if user is Super Admin (bypasses all other checks)
      if (allowSuperAdmin && isSuperAdmin(session.user.role)) {
        return handler(request, ...args)
      }

      // Check if user has admin access (for general admin functions)
      if (allowAdminAccess && hasAdminAccess(session.user.role)) {
        return handler(request, ...args)
      }

      // Check required roles
      if (requiredRoles.length > 0) {
        if (!requiredRoles.includes(session.user.role)) {
          return NextResponse.json({ 
            error: "Insufficient role permissions",
            required: requiredRoles,
            current: session.user.role
          }, { status: 403 })
        }
      }

      // Check required permissions
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = permissionManager.hasAllPermissions(
          session.user.role as any, 
          requiredPermissions
        )
        
        if (!hasAllPermissions) {
          const userPermissions = permissionManager.getRolePermissions(session.user.role as any)
          const missingPermissions = requiredPermissions.filter(
            permission => !userPermissions.includes(permission)
          )
          
          return NextResponse.json({ 
            error: "Insufficient permissions",
            required: requiredPermissions,
            missing: missingPermissions,
            current: userPermissions
          }, { status: 403 })
        }
      }

      return handler(request, ...args)
    } catch (error) {
      console.error("Permission check error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

export function requireSuperAdmin(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withPermissionCheck(handler, { 
    allowSuperAdmin: true,
    allowAdminAccess: false 
  })
}

export function requireAdminAccess(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withPermissionCheck(handler, { 
    allowSuperAdmin: true,
    allowAdminAccess: true 
  })
}

export function requirePermissions(
  permissions: string[],
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withPermissionCheck(handler, { 
    requiredPermissions: permissions,
    allowSuperAdmin: true 
  })
}

export function requireRoles(
  roles: string[],
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withPermissionCheck(handler, { 
    requiredRoles: roles,
    allowSuperAdmin: true 
  })
}

// Helper function to check permissions in API routes
export async function checkPermissions(
  request: NextRequest,
  options: PermissionCheckOptions = {}
): Promise<{ allowed: boolean; error?: NextResponse; session?: any }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return { 
        allowed: false, 
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const { 
      requiredPermissions = [], 
      requiredRoles = [], 
      allowSuperAdmin = true,
      allowAdminAccess = false 
    } = options

    // Check if user is Super Admin (bypasses all other checks)
    if (allowSuperAdmin && isSuperAdmin(session.user.role)) {
      return { allowed: true, session }
    }

    // Check if user has admin access (for general admin functions)
    if (allowAdminAccess && hasAdminAccess(session.user.role)) {
      return { allowed: true, session }
    }

    // Check required roles
    if (requiredRoles.length > 0) {
      if (!requiredRoles.includes(session.user.role)) {
        return { 
          allowed: false, 
          error: NextResponse.json({ 
            error: "Insufficient role permissions",
            required: requiredRoles,
            current: session.user.role
          }, { status: 403 })
        }
      }
    }

    // Check required permissions
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = permissionManager.hasAllPermissions(
        session.user.role as any, 
        requiredPermissions
      )
      
      if (!hasAllPermissions) {
        const userPermissions = permissionManager.getRolePermissions(session.user.role as any)
        const missingPermissions = requiredPermissions.filter(
          permission => !userPermissions.includes(permission)
        )
        
        return { 
          allowed: false, 
          error: NextResponse.json({ 
            error: "Insufficient permissions",
            required: requiredPermissions,
            missing: missingPermissions,
            current: userPermissions
          }, { status: 403 })
        }
      }
    }

    return { allowed: true, session }
  } catch (error) {
    console.error("Permission check error:", error)
    return { 
      allowed: false, 
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

// Client-side permission checking utilities
export function hasClientPermission(
  userPermissions: string[], 
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission)
}

export function hasClientRole(
  userRole: string, 
  requiredRoles: string[]
): boolean {
  return requiredRoles.includes(userRole)
}

export function isClientSuperAdmin(userRole: string): boolean {
  return userRole === "super_admin"
}

export function hasClientAdminAccess(userRole: string): boolean {
  return ["super_admin", "audit_manager", "auditor", "management"].includes(userRole)
}
