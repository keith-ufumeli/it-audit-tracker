export interface User {
  id: string
  name: string
  email: string
  role: "super_admin" | "audit_manager" | "auditor" | "management" | "client" | "department"
  department: string
  isActive: boolean
  permissions: string[]
  password: string // Hashed password
  lastLogin?: string
  createdAt: string
  updatedAt: string
}
