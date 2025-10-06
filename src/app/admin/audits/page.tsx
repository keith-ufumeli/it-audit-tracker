"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLoading } from "@/hooks/use-loading"
import { useToast } from "@/hooks/use-toast"
import { Audit } from "@/lib/database"
import { usePagination, PaginationComponent } from "@/components/ui/pagination"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  Plus,
  Search,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit,
  Eye,
  UserPlus,
  Filter,
  PlayCircle,
  PauseCircle,
  Target,
  TrendingUp
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loader"

export default function AuditsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const { toast } = useToast()
  const [audits, setAudits] = useState<Audit[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  
  // Form state for new audit
  const [newAudit, setNewAudit] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    priority: "medium",
    scope: "",
  })

  const loadAudits = useCallback(async () => {
    startLoading("Loading audits...")
    try {
      // Fetch fresh data from API instead of using cached data
      const response = await fetch("/api/audits")
      const result = await response.json()
      
      if (result.success && result.data) {
        setAudits(result.data)
      } else {
        console.error("Failed to load audits:", result.error)
      }
    } catch (error) {
      console.error("Error loading audits:", error)
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      router.push("/client")
      return
    }

    loadAudits()
  }, [session, status, router, loadAudits])

  const handleCreateAudit = async () => {
    if (!newAudit.title || !newAudit.description || !newAudit.startDate || !newAudit.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    startLoading("Creating audit...")
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newAudit.title,
          description: newAudit.description,
          startDate: newAudit.startDate,
          endDate: newAudit.endDate,
          priority: newAudit.priority,
          scope: newAudit.scope,
          complianceFrameworks: "",
          assignedAuditors: []
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Audit created successfully",
        })
        setIsCreateDialogOpen(false)
        setNewAudit({
          title: "",
          description: "",
          startDate: "",
          endDate: "",
          priority: "medium",
          scope: "",
        })
        // Reload audits to show the new one
        await loadAudits()
      } else {
        toast({
          title: "Error",
          description: `Failed to create audit: ${data.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating audit:", error)
      toast({
        title: "Error",
        description: "Failed to create audit. Please try again.",
        variant: "destructive",
      })
    } finally {
      stopLoading()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4" />
      case "in_progress": return <PlayCircle className="h-4 w-4" />
      case "planning": return <Target className="h-4 w-4" />
      case "on_hold": return <PauseCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100 hover:bg-green-200"
      case "in_progress": return "text-blue-600 bg-blue-100 hover:bg-blue-200"
      case "planning": return "text-purple-600 bg-purple-100 hover:bg-purple-200"
      case "on_hold": return "text-yellow-600 bg-yellow-100 hover:bg-yellow-200"
      default: return "text-gray-600 bg-gray-100 hover:bg-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-100 hover:bg-red-200"
      case "medium": return "text-orange-600 bg-orange-100 hover:bg-orange-200"
      case "low": return "text-green-600 bg-green-100 hover:bg-green-200"
      default: return "text-gray-600 bg-gray-100 hover:bg-gray-200"
    }
  }

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         audit.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = selectedTab === "all" || audit.status === selectedTab
    return matchesSearch && matchesTab
  })

  // Pagination logic
  const {
    currentPage,
    totalPages,
    currentData: paginatedAudits,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(filteredAudits, itemsPerPage)

  if (status === "loading" || isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!session) return null

  const canCreateAudit = session.user.permissions.includes("create_audit")

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Audit Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, assign, and track audit tasks
            </p>
          </div>
          {canCreateAudit && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Audit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Create New Audit</DialogTitle>
                  <DialogDescription>
                    Define the audit scope, timeline, and assign team members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Audit Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Q2 2024 Security Audit"
                      value={newAudit.title}
                      onChange={(e) => setNewAudit({...newAudit, title: e.target.value})}
                      className="focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide a detailed description of the audit objectives..."
                      value={newAudit.description}
                      onChange={(e) => setNewAudit({...newAudit, description: e.target.value})}
                      rows={4}
                      className="focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newAudit.startDate}
                        onChange={(e) => setNewAudit({...newAudit, startDate: e.target.value})}
                        className="focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newAudit.endDate}
                        onChange={(e) => setNewAudit({...newAudit, endDate: e.target.value})}
                        className="focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      aria-label="Select audit priority"
                      value={newAudit.priority}
                      onChange={(e) => setNewAudit({...newAudit, priority: e.target.value})}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scope">Scope (comma-separated)</Label>
                    <Input
                      id="scope"
                      placeholder="e.g., Network Security, Access Controls, Data Protection"
                      value={newAudit.scope}
                      onChange={(e) => setNewAudit({...newAudit, scope: e.target.value})}
                      className="focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAudit}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    Create Audit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search and Filter */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search audits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for filtering */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              All ({audits.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="planning" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Planning
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Completed
            </TabsTrigger>
            <TabsTrigger value="on_hold" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
              On Hold
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAudits.map((audit, index) => (
                <Card 
                  key={audit.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => router.push(`/admin/audits/${audit.id}`)}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(audit.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(audit.status)}
                            <span>{audit.status.replace('_', ' ')}</span>
                          </div>
                        </Badge>
                        <Badge className={getPriorityColor(audit.priority)}>
                          {audit.priority}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-orange-600 transition-colors line-clamp-2">
                        {audit.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {audit.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Progress
                        </span>
                        <span className="font-semibold">{audit.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                          style={{ width: `${audit.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-xs">
                          {new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="text-xs">
                          {audit.assignedAuditors.length} auditor{audit.assignedAuditors.length !== 1 ? 's' : ''} assigned
                        </span>
                      </div>
                      {audit.findings && (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          <span className="text-xs">
                            {audit.findings.length} finding{audit.findings.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Compliance Frameworks */}
                    {audit.complianceFrameworks && audit.complianceFrameworks.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {audit.complianceFrameworks.map((framework) => (
                          <Badge key={framework} variant="secondary" className="text-xs">
                            {framework}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:text-orange-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/audits/${audit.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {canCreateAudit && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/audits/${audit.id}`)
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hover:text-green-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/audits/${audit.id}`)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Pagination */}
            {filteredAudits.length > 0 && (
              <div className="mt-8">
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  onPreviousPage={goToPreviousPage}
                  onNextPage={goToNextPage}
                  hasNextPage={hasNextPage}
                  hasPreviousPage={hasPreviousPage}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  showInfo={true}
                />
              </div>
            )}
            
            {filteredAudits.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No audits found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search query" : "Create your first audit to get started"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

