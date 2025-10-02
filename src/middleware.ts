import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { UserRole, getPortalRoute } from "@/lib/auth"
import { activityLoggingMiddleware } from "./middleware/activity-logger"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Define route access rules
    const adminRoutes = ["/admin"]
    const clientRoutes = ["/client"]
    const publicRoutes = ["/", "/auth"]

    // Check if user is trying to access admin routes
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
    const isClientRoute = clientRoutes.some(route => pathname.startsWith(route))
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))

    // If accessing public routes, allow
    if (isPublicRoute) {
      return NextResponse.next()
    }

    // If no token and trying to access protected routes, redirect to sign in
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    const userRole = token.role as UserRole

    // Admin role access
    const adminRoles: UserRole[] = ["audit_manager", "auditor", "management"]
    // Client role access
    const clientRoles: UserRole[] = ["client", "department"]

    // Redirect logic for role-based access
    if (isAdminRoute && !adminRoles.includes(userRole)) {
      // User doesn't have admin access, redirect to their appropriate portal
      const redirectUrl = getPortalRoute(userRole)
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    if (isClientRoute && !clientRoles.includes(userRole)) {
      // User doesn't have client access, redirect to their appropriate portal
      const redirectUrl = getPortalRoute(userRole)
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    // Log activity for authenticated requests
    const response = NextResponse.next()
    activityLoggingMiddleware(req, response)
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        const publicRoutes = ["/", "/auth"]

        // Allow access to public routes without authentication
        if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
          return true
        }

        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
