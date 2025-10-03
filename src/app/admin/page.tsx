"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FullPageLoader } from "@/components/ui/loader"
import AdminLayout from "@/components/admin/admin-layout"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Check if user has admin access
    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      router.push("/client")
      return
    }

    // Redirect to dashboard since this page is now just a landing page
    router.push("/admin/dashboard")
  }, [session, status, router])

  if (status === "loading") {
    return (
      <FullPageLoader 
        text="Loading Admin Portal..." 
        variant="primary"
      />
    )
  }

  if (!session) {
    return null
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Admin Portal</h1>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    </AdminLayout>
  )
}