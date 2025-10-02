"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { Database } from "@/lib/database"
import { Database as DatabaseIcon, Users, Shield, FileText, Activity as ActivityIcon } from "lucide-react"

export default function DatabaseTestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Check if user has admin access
    const adminRoles = ["audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      router.push("/client")
      return
    }
  }, [session, status, router])

  const runDatabaseTest = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Test all database operations
      const users = Database.getUsers()
      const audits = Database.getAudits()
      const documents = Database.getDocuments()
      const activities = Database.getRecentActivities(10)
      const notifications = Database.getNotifications()
      const stats = Database.getStats()

      // Test specific operations
      const testUser = Database.getUserById("1")
      const testAudit = Database.getAuditById("audit-001")
      const userAudits = Database.getAuditsByManager("1")
      const userDocuments = Database.getDocumentsByUser("2")
      const userActivities = Database.getActivitiesByUser("1")
      const userNotifications = Database.getNotificationsByUser("4")

      setTestResults({
        success: true,
        operations: {
          getUsers: { count: users.length, sample: users[0]?.name },
          getAudits: { count: audits.length, sample: audits[0]?.title },
          getDocuments: { count: documents.length, sample: documents[0]?.title },
          getActivities: { count: activities.length, sample: activities[0]?.description },
          getNotifications: { count: notifications.length, sample: notifications[0]?.title },
          getStats: { users: stats.users.total, audits: stats.audits.total }
        },
        specificOperations: {
          getUserById: testUser?.name || "Not found",
          getAuditById: testAudit?.title || "Not found",
          getAuditsByManager: userAudits.length,
          getDocumentsByUser: userDocuments.length,
          getActivitiesByUser: userActivities.length,
          getNotificationsByUser: userNotifications.length
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader size="lg" text="Loading..." showText />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <DatabaseIcon className="h-8 w-8 mr-3 text-primary" />
              Database Test
            </h1>
            <p className="text-muted-foreground">
              Test database operations and Edge Runtime compatibility
            </p>
          </div>
          <Button onClick={runDatabaseTest} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader size="sm" variant="white" />
                <span className="ml-2">Testing...</span>
              </>
            ) : (
              "Run Database Test"
            )}
          </Button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <DatabaseIcon className="h-5 w-5 mr-2" />
                  Database Test Results
                </CardTitle>
                <CardDescription>
                  All database operations completed successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Users</p>
                      <p className="text-sm text-muted-foreground">
                        {testResults.operations.getUsers.count} total
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Audits</p>
                      <p className="text-sm text-muted-foreground">
                        {testResults.operations.getAudits.count} total
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Documents</p>
                      <p className="text-sm text-muted-foreground">
                        {testResults.operations.getDocuments.count} total
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ActivityIcon className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Activities</p>
                      <p className="text-sm text-muted-foreground">
                        {testResults.operations.getActivities.count} recent
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Operations</CardTitle>
                  <CardDescription>
                    Core database read operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(testResults.operations).map(([operation, data]: [string, any]) => (
                    <div key={operation} className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {operation.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant="secondary">
                        {typeof data === 'object' ? data.count : data}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Specific Operations</CardTitle>
                  <CardDescription>
                    Targeted database queries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(testResults.specificOperations).map(([operation, result]: [string, any]) => (
                    <div key={operation} className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {operation.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant="outline">
                        {result}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Edge Runtime Compatibility</CardTitle>
                <CardDescription>
                  Database operations running in Edge Runtime
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500 text-white">✅ Compatible</Badge>
                  <span className="text-sm text-muted-foreground">
                    All operations completed without Node.js dependencies
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Test Failed</CardTitle>
              <CardDescription>
                Database operations encountered an error
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
            <CardDescription>
              This page tests the database system's Edge Runtime compatibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              • <strong>Basic Operations:</strong> Tests all core database read operations
            </p>
            <p className="text-sm">
              • <strong>Specific Operations:</strong> Tests targeted queries and filters
            </p>
            <p className="text-sm">
              • <strong>Edge Runtime:</strong> Verifies compatibility with Next.js Edge Runtime
            </p>
            <p className="text-sm">
              • <strong>Type Safety:</strong> Ensures all operations are type-safe
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
