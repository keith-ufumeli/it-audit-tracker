"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLoading } from "@/hooks/use-loading"
import { useToast } from "@/hooks/use-toast"
import { Database, Document } from "@/lib/database"
import ClientLayout from "@/components/client/client-layout"
import { DocumentViewer } from "@/components/ui/document-viewer"
import { 
  FileText,
  Upload,
  Search,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Eye,
  Send,
  X,
  FileCheck,
  Paperclip,
  RefreshCw
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loader"

export default function ClientDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadNotes, setUploadNotes] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = useCallback(async () => {
    startLoading("Loading documents...")
    try {
      // Fetch fresh data from API instead of using cached data
      const response = await fetch("/api/audits")
      const result = await response.json()
      
      if (result.success && result.data) {
        // Get all documents from all audits
        const allDocuments = result.data.flatMap((audit: any) => audit.documents || [])
        
        // Filter documents for current user
        const userDocs = allDocuments.filter((doc: any) => 
          doc.requestedFrom === session?.user?.id || doc.uploadedBy === session?.user?.id
        )
        setDocuments(userDocs)
      } else {
        // Fallback to in-memory database if API fails
        const allDocuments = Database.getDocuments()
        const userDocs = allDocuments.filter(doc => 
          doc.requestedFrom === session?.user?.id || doc.uploadedBy === session?.user?.id
        )
        setDocuments(userDocs)
      }
    } catch (error) {
      console.error("Error loading documents:", error)
      // Fallback to in-memory database
      const allDocuments = Database.getDocuments()
      const userDocs = allDocuments.filter(doc => 
        doc.requestedFrom === session?.user?.id || doc.uploadedBy === session?.user?.id
      )
      setDocuments(userDocs)
    } finally {
      stopLoading()
    }
  }, [session?.user?.id, startLoading, stopLoading])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    const clientRoles = ["client", "department"]
    if (!clientRoles.includes(session.user.role)) {
      router.push("/admin/dashboard")
      return
    }

    loadDocuments()
  }, [session, status, router, loadDocuments])

  const handleUploadClick = (doc: Document) => {
    setSelectedDocument(doc)
    setIsUploadDialogOpen(true)
    setUploadSuccess(false)
    setUploadFile(null)
    setUploadNotes("")
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadFile || !selectedDocument) return

    startLoading("Uploading document...")
    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("documentId", selectedDocument.id)
      if (uploadNotes) {
        formData.append("notes", uploadNotes)
      }

      const response = await fetch("/api/upload/document", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      setUploadSuccess(true)
      toast({
        title: "Upload Successful",
        description: "Document uploaded successfully and auditor has been notified.",
      })
      
      // Immediately update the document status in the local state
      if (selectedDocument) {
        setDocuments(prevDocs => 
          prevDocs.map(doc => 
            doc.id === selectedDocument.id 
              ? { ...doc, status: "submitted", uploadedBy: session?.user?.id, uploadedAt: new Date().toISOString() }
              : doc
          )
        )
      }
      
      setTimeout(() => {
        setIsUploadDialogOpen(false)
        loadDocuments() // Refresh to get the latest data from server
      }, 1500)
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      stopLoading()
    }
  }

  const handleViewDocument = async (doc: Document) => {
    try {
      // Check if document can be viewed
      const response = await fetch(`/api/documents/${doc.id}/view`, { method: "HEAD" })
      if (!response.ok) {
        throw new Error("Document not available for viewing")
      }
      
      setViewingDocument(doc)
    } catch (error) {
      console.error("Error viewing document:", error)
      toast({
        title: "View Failed",
        description: "Document is not available for viewing. It may not be uploaded yet.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`)
      
      if (!response.ok) {
        throw new Error("Download failed")
      }

      // Get filename from response headers or use document title
      const contentDisposition = response.headers.get("content-disposition")
      let filename = doc.title
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download Started",
        description: `Downloading ${filename}`,
      })
    } catch (error) {
      console.error("Error downloading document:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted": return <CheckCircle className="h-4 w-4" />
      case "pending": return <Clock className="h-4 w-4" />
      case "draft": return <FileText className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "text-green-600 bg-green-100 hover:bg-green-200"
      case "pending": return "text-orange-600 bg-orange-100 hover:bg-orange-200"
      case "draft": return "text-gray-600 bg-gray-100 hover:bg-gray-200"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = selectedTab === "all" || doc.status === selectedTab
    return matchesSearch && matchesTab
  })

  if (status === "loading" || isLoading) {
    return (
      <ClientLayout>
        <div className="p-6 space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (!session) return null

  return (
    <ClientLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Document Requests
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and upload requested documents
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={loadDocuments}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{documents.length}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {documents.filter(d => d.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {documents.filter(d => d.status === "submitted").length}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {documents.filter(d => d.status === "pending" && isOverdue(d.dueDate)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Pending
            </TabsTrigger>
            <TabsTrigger value="submitted" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Submitted
            </TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-gray-500 data-[state=active]:text-white">
              Draft
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDocuments.map((doc, index) => (
                <Card 
                  key={doc.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(doc.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(doc.status)}
                            <span className="capitalize">{doc.status}</span>
                          </div>
                        </Badge>
                        {doc.isConfidential && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Confidential
                          </Badge>
                        )}
                        {isOverdue(doc.dueDate) && doc.status === "pending" && (
                          <Badge className="bg-red-500 text-white animate-pulse">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-blue-600 transition-colors">
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {doc.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-xs">
                          Due: {new Date(doc.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-xs">
                          Requested: {new Date(doc.requestedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.uploadedAt && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-xs">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {doc.fileName && (
                        <div className="flex items-center text-muted-foreground">
                          <Paperclip className="h-4 w-4 mr-2" />
                          <span className="text-xs truncate">{doc.fileName}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      {doc.status === "pending" ? (
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                          onClick={() => handleUploadClick(doc)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2 w-full">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search query" : "No document requests at this time"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                {selectedDocument?.title}
              </DialogDescription>
            </DialogHeader>
            
            {uploadSuccess ? (
              <div className="py-8">
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Document uploaded successfully! Email notification sent to auditor.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select File *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    {uploadFile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FileCheck className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">{uploadFile.name}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ""
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to select file or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, DOCX, XLS, XLSX (Max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    aria-label="Select document file to upload"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional information or comments..."
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    rows={3}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Uploaded documents will be securely stored and an email notification will be sent to the requesting auditor.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {!uploadSuccess && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUploadSubmit}
                  disabled={!uploadFile}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Upload & Notify
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Document Viewer */}
        {viewingDocument && (
          <DocumentViewer
            documentId={viewingDocument.id}
            documentTitle={viewingDocument.title}
            fileType={viewingDocument.fileName?.split('.').pop() || 'unknown'}
            onClose={() => setViewingDocument(null)}
          />
        )}
      </div>
    </ClientLayout>
  )
}

