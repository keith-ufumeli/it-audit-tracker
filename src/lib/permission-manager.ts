import { UserRole } from "./auth"
import { Database } from "./database"
// Import permissions data directly for Edge Runtime compatibility
import permissionsData from '../data/permissions.json'

export interface Permission {
  id: string
  name: string
  description: string
  category: string
  isSystemPermission: boolean
}

export interface RolePermission {
  role: UserRole
  permissions: string[]
}

export class PermissionManager {
  private static instance: PermissionManager
  private permissions: Permission[] = []
  private rolePermissions: RolePermission[] = []

  private constructor() {
    this.loadPermissions()
    this.initializeDefaultRolePermissions()
  }

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager()
    }
    return PermissionManager.instance
  }

  private loadPermissions(): void {
    try {
      // Use imported data for Edge Runtime compatibility
      this.permissions = permissionsData as Permission[]
    } catch (error) {
      console.error('Error loading permissions:', error)
      this.permissions = []
    }
  }

  private initializeDefaultRolePermissions(): void {
    this.rolePermissions = [
      {
        role: "super_admin",
        permissions: this.permissions.map(p => p.id)
      },
      {
        role: "audit_manager",
        permissions: [
          "create_audit",
          "assign_tasks",
          "view_reports",
          "manage_users",
          "view_all_logs",
          "approve_audits",
          "export_data",
          "manage_reports",
          "manage_alerts"
        ]
      },
      {
        role: "auditor",
        permissions: [
          "view_logs",
          "submit_reports",
          "request_documents",
          "flag_activities",
          "view_assigned_audits",
          "upload_evidence"
        ]
      },
      {
        role: "management",
        permissions: [
          "view_dashboards",
          "approve_reports",
          "view_summaries",
          "view_compliance_scores",
          "export_executive_reports"
        ]
      },
      {
        role: "client",
        permissions: [
          "view_notifications",
          "respond_requests",
          "view_audit_status",
          "download_reports"
        ]
      },
      {
        role: "department",
        permissions: [
          "upload_documents",
          "view_requests",
          "respond_to_auditors",
          "track_submissions"
        ]
      }
    ]
  }

  public getAllPermissions(): Permission[] {
    return this.permissions
  }

  public getPermissionsByCategory(category: string): Permission[] {
    return this.permissions.filter(p => p.category === category)
  }

  public getPermissionById(id: string): Permission | undefined {
    return this.permissions.find(p => p.id === id)
  }

  public getRolePermissions(role: UserRole): string[] {
    const rolePermission = this.rolePermissions.find(rp => rp.role === role)
    return rolePermission ? rolePermission.permissions : []
  }

  public updateRolePermissions(role: UserRole, permissions: string[]): boolean {
    try {
      const rolePermissionIndex = this.rolePermissions.findIndex(rp => rp.role === role)
      if (rolePermissionIndex !== -1) {
        this.rolePermissions[rolePermissionIndex].permissions = permissions
        this.saveRolePermissions()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating role permissions:', error)
      return false
    }
  }

  public addPermission(permission: Permission): boolean {
    try {
      if (this.permissions.find(p => p.id === permission.id)) {
        return false // Permission already exists
      }
      this.permissions.push(permission)
      this.savePermissions()
      return true
    } catch (error) {
      console.error('Error adding permission:', error)
      return false
    }
  }

  public updatePermission(permission: Permission): boolean {
    try {
      const index = this.permissions.findIndex(p => p.id === permission.id)
      if (index !== -1) {
        this.permissions[index] = permission
        this.savePermissions()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating permission:', error)
      return false
    }
  }

  public deletePermission(permissionId: string): boolean {
    try {
      const permission = this.getPermissionById(permissionId)
      if (permission && permission.isSystemPermission) {
        return false // Cannot delete system permissions
      }

      const index = this.permissions.findIndex(p => p.id === permissionId)
      if (index !== -1) {
        this.permissions.splice(index, 1)
        this.savePermissions()
        
        // Remove permission from all roles
        this.rolePermissions.forEach(rp => {
          rp.permissions = rp.permissions.filter(p => p !== permissionId)
        })
        this.saveRolePermissions()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting permission:', error)
      return false
    }
  }

  public hasPermission(userRole: UserRole, permissionId: string): boolean {
    const rolePermissions = this.getRolePermissions(userRole)
    return rolePermissions.includes(permissionId)
  }

  public hasAnyPermission(userRole: UserRole, permissionIds: string[]): boolean {
    const rolePermissions = this.getRolePermissions(userRole)
    return permissionIds.some(permissionId => rolePermissions.includes(permissionId))
  }

  public hasAllPermissions(userRole: UserRole, permissionIds: string[]): boolean {
    const rolePermissions = this.getRolePermissions(userRole)
    return permissionIds.every(permissionId => rolePermissions.includes(permissionId))
  }

  public getPermissionCategories(): string[] {
    const categories = new Set(this.permissions.map(p => p.category))
    return Array.from(categories).sort()
  }

  private savePermissions(): void {
    try {
      // Note: In Edge Runtime, we can't write to files
      // Permissions are updated in memory only
      // In production, this would save to a database or external API
      console.log('Permissions updated in memory (Edge Runtime compatible)')
    } catch (error) {
      console.error('Error saving permissions:', error)
    }
  }

  private saveRolePermissions(): void {
    // In a real application, this would save to a database
    // For now, we'll just update the in-memory structure
    console.log('Role permissions updated:', this.rolePermissions)
  }

  public validatePermissionStructure(permission: Permission): string[] {
    const errors: string[] = []
    
    if (!permission.id || permission.id.trim() === '') {
      errors.push('Permission ID is required')
    }
    
    if (!permission.name || permission.name.trim() === '') {
      errors.push('Permission name is required')
    }
    
    if (!permission.description || permission.description.trim() === '') {
      errors.push('Permission description is required')
    }
    
    if (!permission.category || permission.category.trim() === '') {
      errors.push('Permission category is required')
    }
    
    if (permission.id && !/^[a-z_]+$/.test(permission.id)) {
      errors.push('Permission ID must contain only lowercase letters and underscores')
    }
    
    return errors
  }
}
