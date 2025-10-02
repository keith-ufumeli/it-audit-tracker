import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Define user roles
export type UserRole = "audit_manager" | "auditor" | "management" | "client" | "department"

// Define user interface
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  permissions: string[]
}

// Mock user database (in production, this would be a real database)
const mockUsers: User[] = [
  {
    id: "1",
    email: "manager@audit.com",
    name: "John Manager",
    role: "audit_manager",
    permissions: ["create_audit", "assign_tasks", "view_reports", "manage_users"]
  },
  {
    id: "2",
    email: "auditor@audit.com",
    name: "Jane Auditor",
    role: "auditor",
    department: "IT Security",
    permissions: ["view_logs", "submit_reports", "request_documents", "flag_activities"]
  },
  {
    id: "3",
    email: "management@audit.com",
    name: "Bob Executive",
    role: "management",
    permissions: ["view_dashboards", "approve_reports", "view_summaries"]
  },
  {
    id: "4",
    email: "client@company.com",
    name: "Alice Client",
    role: "client",
    permissions: ["view_notifications", "respond_requests"]
  },
  {
    id: "5",
    email: "dept@company.com",
    name: "Charlie Department",
    role: "department",
    department: "HR",
    permissions: ["upload_documents", "view_requests"]
  }
]

// Hash passwords for mock users (in production, these would be stored hashed)
const mockPasswords: Record<string, string> = {
  "manager@audit.com": "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  "auditor@audit.com": "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  "management@audit.com": "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  "client@company.com": "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  "dept@company.com": "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user by email
        const user = mockUsers.find(u => u.email === credentials.email)
        if (!user) {
          return null
        }

        // Verify password
        const hashedPassword = mockPasswords[credentials.email]
        if (!hashedPassword) {
          return null
        }

        const isValidPassword = await bcrypt.compare(credentials.password, hashedPassword)
        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          permissions: user.permissions
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.department = user.department
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.department = token.department as string
        session.user.permissions = token.permissions as string[]
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
}

// Helper function to check if user has permission
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission)
}

// Helper function to check if user has role
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

// Helper function to get portal route based on role
export function getPortalRoute(role: UserRole): string {
  switch (role) {
    case "audit_manager":
    case "auditor":
    case "management":
      return "/admin"
    case "client":
    case "department":
      return "/client"
    default:
      return "/"
  }
}
