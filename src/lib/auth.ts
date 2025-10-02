import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { Database, User } from "./database"

// Define user roles
export type UserRole = "audit_manager" | "auditor" | "management" | "client" | "department"

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

        // Find user by email from JSON database
        const user = Database.getUserByEmail(credentials.email)
        if (!user || !user.isActive) {
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

        // Update last login
        Database.updateUser(user.id, { lastLogin: new Date().toISOString() })

        // Log login activity
        Database.addActivity({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: "login",
          description: "User logged into the system",
          timestamp: new Date().toISOString(),
          ipAddress: "127.0.0.1", // In production, get from request
          userAgent: "NextAuth.js", // In production, get from request
          severity: "info",
          resource: "authentication",
          metadata: {
            sessionId: `sess_${Date.now()}`,
            loginMethod: "credentials"
          }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
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
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key-not-for-production",
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
