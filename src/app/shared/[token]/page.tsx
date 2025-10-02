"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLoading } from "@/hooks/use-loading"
import { 
  FileText,
  Download,
  Share2,
  MessageSquare,
  Eye,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react"

interface SharedReport {
  id: string
  reportName: string
  reportType: string
  reportData: any
  sharedBy: string
  sharedByName: string
  sharedAt: string
  expiresAt?: string
  accessLevel: string
  permissions: {
    allowDownload: boolean
    allowPrint: boolean
    allowShare: boolean
    requireAuthentication: boolean
  }
  metadata: {
    description?: string
    tags?: string[]
    confidential: boolean
    version: string
  }
  viewCount: number
  lastViewed?: string
}

interface ReportComment {
  id: string
  userId: string
  userName: string
  comment: string
  createdAt: string
  isResolved: boolean
}

export default function SharedReportPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const [sharedReport, setSharedReport] = useState<SharedReport | null>(null)
  const [comments, setComments] = useState<ReportComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (params.token) {
      loadSharedReport(params.token as string)
    }
  }, [params.token])

  const loadSharedReport = async (token: string) => {
    startLoading("Loading shared report...")
    try {
      const response = await fetch(`/api/reports/share?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load shared report")
      }

      if (data.success) {
        setSharedReport(data.data)
        loadComments(data.data.id)
      } else {
        setError("Report not found or access denied")
      }
    } catch (error) {
      console.error("Error loading shared report:", error)
      setError(error instanceof Error ? error.message : "Failed to load report")
    } finally {
      stopLoading()
    }
  }

  const loadComments = async (sharedReportId: string) => {
    try {
      // In a real implementation, you would fetch comments from the API
      // For now, we'll use mock data
      setComments([
        {
          id: "comment-1",
          userId: "user-1",
          userName: "John Manager",
          comment: "Great report! The compliance metrics look good.",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isResolved: false
        }
      ])
    } catch (error) {
      console.error("Error loading comments:", error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !sharedReport) return

    try {
      const response = await fetch("/api/reports/share", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add-comment",
          sharedReportId: sharedReport.id,
          comment: newComment
        })
      })

      if (response.ok) {
        setNewComment("")
        loadComments(sharedReport.id)
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const handleDownload = () => {
    if (!sharedReport) return
    
    // In a real implementation, you would download the actual report file
    console.log("Downloading report:", sharedReport.reportName)
  }

  const handlePrint = () => {
    window.print()
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'audit': return <FileText className="h-5 w-5" />
      case 'compliance': return <Shield className="h-5 w-5" />
      case 'activity': return <BarChart3 className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'view': return "text-blue-600 bg-blue-100"
      case 'download': return "text-green-600 bg-green-100"
      case 'edit': return "text-orange-600 bg-orange-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared report...</p>
        </div>
      </div>
    )
  }

  if (error || !sharedReport) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || "This shared report is not available or has expired."}
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getReportTypeIcon(sharedReport.reportType)}
              <div>
                <h1 className="text-3xl font-bold">{sharedReport.reportName}</h1>
                <p className="text-muted-foreground">
                  Shared by {sharedReport.sharedByName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getAccessLevelColor(sharedReport.accessLevel)}>
                {sharedReport.accessLevel}
              </Badge>
              {sharedReport.metadata.confidential && (
                <Badge variant="destructive">Confidential</Badge>
              )}
            </div>
          </div>

          {/* Report Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Shared</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sharedReport.sharedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Views</p>
                    <p className="text-xs text-muted-foreground">
                      {sharedReport.viewCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Shared By</p>
                    <p className="text-xs text-muted-foreground">
                      {sharedReport.sharedByName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Version</p>
                    <p className="text-xs text-muted-foreground">
                      {sharedReport.metadata.version}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 mb-6">
            {sharedReport.permissions.allowDownload && (
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {sharedReport.permissions.allowPrint && (
              <Button onClick={handlePrint} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Print
              </Button>
            )}
            {sharedReport.permissions.allowShare && (
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Description */}
            {sharedReport.metadata.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {sharedReport.metadata.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Report Data */}
            <Card>
              <CardHeader>
                <CardTitle>Report Data</CardTitle>
                <CardDescription>
                  {sharedReport.reportType} report data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sharedReport.reportData.summary && (
                    <div>
                      <h4 className="font-semibold mb-2">Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(sharedReport.reportData.summary).map(([key, value]) => (
                          <div key={key} className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">{value as string}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional report data would be displayed here */}
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Report content would be displayed here</p>
                    <p className="text-sm">This is a preview of the shared report</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-l-2 border-primary pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm">{comment.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.comment}</p>
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No comments yet
                    </p>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={handleAddComment} 
                      size="sm" 
                      disabled={!newComment.trim()}
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Tags */}
            {sharedReport.metadata.tags && sharedReport.metadata.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sharedReport.metadata.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expiration Warning */}
            {sharedReport.expiresAt && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  This report expires on {new Date(sharedReport.expiresAt).toLocaleDateString()}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
