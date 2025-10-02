import { UserRole } from "@/lib/auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      department?: string
      permissions: string[]
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    department?: string
    permissions: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    department?: string
    permissions: string[]
  }
}
