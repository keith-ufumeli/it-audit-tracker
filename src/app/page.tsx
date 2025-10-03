"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FullPageLoader } from "@/components/ui/loader"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (session?.user?.role) {
      // Redirect authenticated users to their appropriate portal
      const role = session.user.role
      if (["audit_manager", "auditor", "management"].includes(role)) {
        router.push("/admin/dashboard")
      } else {
        router.push("/client")
      }
    } else {
      // Redirect unauthenticated users to sign in
      router.push("/auth/signin")
    }
  }, [session, status, router])

  return (
    <FullPageLoader 
      text="Redirecting..." 
      variant="white"
      className="bg-gradient-to-br from-oxford_blue-500 via-oxford_blue-600 to-oxford_blue-700"
    />
  )
}
