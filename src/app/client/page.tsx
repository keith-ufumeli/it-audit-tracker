"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FullPageLoader } from "@/components/ui/loader"
import { Building, Bell, FileText, Upload, LogOut } from "lucide-react"

export default function ClientPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Check if user has client access
    const clientRoles = ["client", "department"]
    if (!clientRoles.includes(session.user.role)) {
      router.push("/admin/dashboard")
      return
    }

    // Redirect to client dashboard
    router.push("/client/dashboard")
  }, [session, status, router])

  if (status === "loading") {
    return (
      <FullPageLoader 
        text="Loading Client Portal..." 
        variant="primary"
      />
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "client":
        return "Client"
      case "department":
        return "Department"
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "client":
        return "bg-blue-500"
      case "department":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Client Portal</h1>
                <p className="text-muted-foreground">IT Audit Trail Tracker</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">{session.user.name}</p>
                <Badge className={`${getRoleColor(session.user.role)} text-white`}>
                  {getRoleDisplayName(session.user.role)}
                </Badge>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                2 new requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Document Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                1 pending response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uploaded Documents</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +3 this week
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the Client Portal</CardTitle>
              <CardDescription>
                You have access to the following features based on your role: {getRoleDisplayName(session.user.role)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Your Permissions:</h3>
                  <div className="flex flex-wrap gap-2">
                    {session.user.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary">
                        {permission.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Available Features:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>View audit notifications and updates</li>
                    <li>Respond to audit requests</li>
                    <li>Upload requested documents securely</li>
                    <li>Track document submission status</li>
                    <li>Communicate with audit team</li>
                    <li>View audit progress and results</li>
                  </ul>
                </div>
                {session.user.department && (
                  <div>
                    <h3 className="font-semibold mb-2">Department:</h3>
                    <Badge variant="outline">{session.user.department}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
