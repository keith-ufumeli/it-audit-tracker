"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLoading } from "@/hooks/use-loading"
import { useToast } from "@/hooks/use-toast"
import { Database, Audit } from "@/lib/database"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Edit,
  Trash2,
  UserPlus,
  TrendingUp,
  Target,
  Activity
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loader"

export default function AuditDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const auditId = params.id as string
  const { isLoading, startLoading, stopLoading } = useLoading()
  const { toast } = useToast()
  const [audit, setAudit] = useState<Audit | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isAddFindingDialogOpen, setIsAddFindingDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [editingAudit, setEditingAudit] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    priority: "medium",
    scope: "",
    complianceFrameworks: ""
  })
  const [newFinding, setNewFinding] = useState({
    title: "",
    description: "",
    severity: "medium",
    recommendation: "",
    dueDate: ""
  })
  const [selectedAuditor, setSelectedAuditor] = useState("")
  const [availableAuditors, setAvailableAuditors] = useState<any[]>([])
  const [auditManager, setAuditManager] = useState<any>(null)
  const [assignedAuditors, setAssignedAuditors] = useState<any[]>([])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    const adminRoles = ["audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      router.push("/client")
      return
    }

    loadAudit()
  }, [session, status, router, auditId])

  const loadAudit = async () => {
    startLoading("Loading audit details...")
    try {
      // Fetch fresh data from API instead of using cached data
      const response = await fetch(`/api/audits/${auditId}`)
      const result = await response.json()
      
      if (!result.success || !result.data) {
        router.push("/admin/audits")
        return
      }
      
      const auditData = result.data
      setAudit(auditData)
      
      // Load user data for audit manager and assigned auditors
      await loadUserData(auditData)
      
      // Initialize edit form with current audit data
      setEditingAudit({
        title: auditData.title,
        description: auditData.description,
        startDate: auditData.startDate,
        endDate: auditData.endDate,
        priority: auditData.priority,
        scope: auditData.scope.join(", "),
        complianceFrameworks: auditData.complianceFrameworks.join(", ")
      })
    } catch (error) {
      console.error("Error loading audit:", error)
      router.push("/admin/audits")
    } finally {
      stopLoading()
    }
  }

  const loadUserData = async (auditData: any) => {
    try {
      // Fetch all users from API
      const response = await fetch("/api/users")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const users = result.data
          
          // Find audit manager
          const manager = users.find((user: any) => user.id === auditData.auditManager)
          setAuditManager(manager || null)
          
          // Find assigned auditors
          const auditors = auditData.assignedAuditors
            .map((id: string) => users.find((user: any) => user.id === id))
            .filter(Boolean)
          setAssignedAuditors(auditors)
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const loadAvailableAuditors = async () => {
    try {
      // Fetch fresh user data from API
      const response = await fetch("/api/users")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const auditors = result.data.filter((user: any) => 
            user.role === "auditor" && 
            audit && 
            !audit.assignedAuditors.includes(user.id)
          )
          setAvailableAuditors(auditors)
        }
      }
    } catch (error) {
      console.error("Error loading auditors:", error)
    }
  }

  const handleEditAudit = async () => {
    if (!audit) return
    
    if (!editingAudit.title || !editingAudit.description || !editingAudit.startDate || !editingAudit.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    startLoading("Updating audit...")
    try {
      const response = await fetch("/api/audits", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auditId: audit.id,
          title: editingAudit.title,
          description: editingAudit.description,
          startDate: editingAudit.startDate,
          endDate: editingAudit.endDate,
          priority: editingAudit.priority,
          scope: editingAudit.scope,
          complianceFrameworks: editingAudit.complianceFrameworks
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Audit updated successfully",
          variant: "success",
        })
        setIsEditDialogOpen(false)
        await loadAudit() // Reload audit data
      } else {
        toast({
          title: "Error",
          description: `Failed to update audit: ${data.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating audit:", error)
      toast({
        title: "Error",
        description: "Failed to update audit. Please try again.",
        variant: "destructive",
      })
    } finally {
      stopLoading()
    }
  }

  const handleCancelAudit = async () => {
    if (!audit) return
    
    startLoading("Cancelling audit...")
    try {
      const response = await fetch("/api/audits", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auditId: audit.id,
          status: "cancelled"
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Audit cancelled successfully",
          variant: "success",
        })
        await loadAudit() // Reload audit data
      } else {
        toast({
          title: "Error",
          description: `Failed to cancel audit: ${data.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cancelling audit:", error)
      toast({
        title: "Error",
        description: "Failed to cancel audit. Please try again.",
        variant: "destructive",
      })
    } finally {
      stopLoading()
    }
  }

  const handleAddFinding = async () => {
    if (!audit) return
    
    if (!newFinding.title || !newFinding.description || !newFinding.dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    startLoading("Adding finding...")
    try {
      const finding = {
        id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: newFinding.title,
        description: newFinding.description,
        severity: newFinding.severity,
        status: "open",
        recommendation: newFinding.recommendation,
        dueDate: newFinding.dueDate,
        createdAt: new Date().toISOString(),
        assignedTo: session?.user.id || ""
      }

      const response = await fetch("/api/audits", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auditId: audit.id,
          findings: [...(audit.findings || []), finding]
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Finding added successfully",
          variant: "success",
        })
        setIsAddFindingDialogOpen(false)
        setNewFinding({
          title: "",
          description: "",
          severity: "medium",
          recommendation: "",
          dueDate: ""
        })
        await loadAudit() // Reload audit data
      } else {
        toast({
          title: "Error",
          description: `Failed to add finding: ${data.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding finding:", error)
      toast({
        title: "Error",
        description: "Failed to add finding. Please try again.",
        variant: "destructive",
      })
    } finally {
      stopLoading()
    }
  }

  const handleAssignAuditor = async () => {
    if (!audit || !selectedAuditor) return

    startLoading("Assigning auditor...")
    try {
      const response = await fetch("/api/audits", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auditId: audit.id,
          assignedAuditors: [...audit.assignedAuditors, selectedAuditor]
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Auditor assigned successfully",
          variant: "success",
        })
        setIsAssignDialogOpen(false)
        setSelectedAuditor("")
        setAvailableAuditors([]) // Clear the list
        await loadAudit() // Reload audit data and user data
      } else {
        toast({
          title: "Error",
          description: `Failed to assign auditor: ${data.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error assigning auditor:", error)
      toast({
        title: "Error",
        description: "Failed to assign auditor. Please try again.",
        variant: "destructive",
      })
    } finally {
      stopLoading()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100"
      case "in_progress": return "text-blue-600 bg-blue-100"
      case "planning": return "text-purple-600 bg-purple-100"
      case "cancelled": return "text-gray-600 bg-gray-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600 bg-red-100"
      case "high": return "text-orange-600 bg-orange-100"
      case "medium": return "text-yellow-600 bg-yellow-100"
      case "low": return "text-green-600 bg-green-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-100"
      case "high": return "text-orange-600 bg-orange-100"
      case "medium": return "text-yellow-600 bg-yellow-100"
      case "low": return "text-blue-600 bg-blue-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CardSkeleton />
            </div>
            <CardSkeleton />
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!session || !audit) return null

  const canEdit = session.user.permissions.includes("create_audit") || 
                  session.user.id === audit.auditManager

  // User details are now loaded via API and stored in state
  // auditManager and assignedAuditors are set by loadUserData()

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/audits")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audits
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{audit.title}</h1>
              <p className="text-muted-foreground mt-1">
                Audit ID: {audit.id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Audit</DialogTitle>
                      <DialogDescription>
                        Update the audit details below
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={editingAudit.title}
                          onChange={(e) => setEditingAudit(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={editingAudit.description}
                          onChange={(e) => setEditingAudit(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">Start Date *</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={editingAudit.startDate}
                            onChange={(e) => setEditingAudit(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate">End Date *</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={editingAudit.endDate}
                            onChange={(e) => setEditingAudit(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={editingAudit.priority} onValueChange={(value) => setEditingAudit(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="scope">Scope (comma-separated)</Label>
                        <Input
                          id="scope"
                          value={editingAudit.scope}
                          onChange={(e) => setEditingAudit(prev => ({ ...prev, scope: e.target.value }))}
                          placeholder="e.g., IT Systems, Network Security, Data Protection"
                        />
                      </div>
                      <div>
                        <Label htmlFor="frameworks">Compliance Frameworks (comma-separated)</Label>
                        <Input
                          id="frameworks"
                          value={editingAudit.complianceFrameworks}
                          onChange={(e) => setEditingAudit(prev => ({ ...prev, complianceFrameworks: e.target.value }))}
                          placeholder="e.g., ISO 27001, SOC 2, GDPR"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditAudit}>
                        Update Audit
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel Audit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Audit</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel this audit? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          setIsCancelDialogOpen(false)
                          handleCancelAudit()
                        }}
                      >
                        Yes, Cancel Audit
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(audit.status)}>
            {audit.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge className={getPriorityColor(audit.priority)}>
            {audit.priority.toUpperCase()} PRIORITY
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Overview</CardTitle>
                <CardDescription>
                  Detailed information about this audit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{audit.description}</p>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Progress
                    </h3>
                    <span className="text-2xl font-bold text-orange-600">{audit.progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                      style={{ width: `${audit.progress}%` }}
                    />
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      Start Date
                    </h3>
                    <p className="text-muted-foreground">
                      {new Date(audit.startDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      End Date
                    </h3>
                    <p className="text-muted-foreground">
                      {new Date(audit.endDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Scope */}
                {audit.scope && audit.scope.length > 0 && (
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <Target className="h-4 w-4 mr-2" />
                      Audit Scope
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {audit.scope.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance Frameworks */}
                {audit.complianceFrameworks && audit.complianceFrameworks.length > 0 && (
                  <div>
                    <h3 className="font-semibold flex items-center mb-2">
                      <Shield className="h-4 w-4 mr-2" />
                      Compliance Frameworks
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {audit.complianceFrameworks.map((framework, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Findings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                      Audit Findings
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Issues and observations from this audit
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <Dialog open={isAddFindingDialogOpen} onOpenChange={setIsAddFindingDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          Add Finding
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Finding</DialogTitle>
                          <DialogDescription>
                            Add a new finding to this audit
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="findingTitle">Title *</Label>
                            <Input
                              id="findingTitle"
                              value={newFinding.title}
                              onChange={(e) => setNewFinding(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Brief title for the finding"
                            />
                          </div>
                          <div>
                            <Label htmlFor="findingDescription">Description *</Label>
                            <Textarea
                              id="findingDescription"
                              value={newFinding.description}
                              onChange={(e) => setNewFinding(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Detailed description of the finding"
                            />
                          </div>
                          <div>
                            <Label htmlFor="findingSeverity">Severity</Label>
                            <Select value={newFinding.severity} onValueChange={(value) => setNewFinding(prev => ({ ...prev, severity: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="findingRecommendation">Recommendation</Label>
                            <Textarea
                              id="findingRecommendation"
                              value={newFinding.recommendation}
                              onChange={(e) => setNewFinding(prev => ({ ...prev, recommendation: e.target.value }))}
                              placeholder="Recommended action to address this finding"
                            />
                          </div>
                          <div>
                            <Label htmlFor="findingDueDate">Due Date *</Label>
                            <Input
                              id="findingDueDate"
                              type="date"
                              value={newFinding.dueDate}
                              onChange={(e) => setNewFinding(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddFindingDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddFinding}>
                            Add Finding
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {audit.findings && audit.findings.length > 0 ? (
                  <div className="space-y-4">
                    {audit.findings.map((finding, index) => (
                      <div 
                        key={finding.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{finding.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {finding.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge className={getSeverityColor(finding.severity)}>
                              {finding.severity}
                            </Badge>
                            <Badge variant="outline">
                              {finding.status}
                            </Badge>
                          </div>
                        </div>
                        {finding.recommendation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">Recommendation:</p>
                            <p className="text-sm text-blue-800 mt-1">{finding.recommendation}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>Due: {new Date(finding.dueDate).toLocaleDateString()}</span>
                          {finding.resolvedAt && (
                            <span className="text-green-600">
                              Resolved: {new Date(finding.resolvedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No findings have been recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Audit Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Audit Manager</h4>
                  <div className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">
                        {auditManager?.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-50">{auditManager?.name}</p>
                      <p className="text-xs text-gray-100">{auditManager?.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">Assigned Auditors</h4>
                    {canEdit && (
                      <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
                        setIsAssignDialogOpen(open)
                        if (open) {
                          loadAvailableAuditors()
                          setSelectedAuditor("")
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <UserPlus className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Auditor</DialogTitle>
                            <DialogDescription>
                              Assign an auditor to this audit
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="auditorSelect">Select Auditor</Label>
                              <Select value={selectedAuditor} onValueChange={setSelectedAuditor}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose an auditor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableAuditors.length > 0 ? (
                                    availableAuditors.map((user: any) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                      No available auditors
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setIsAssignDialogOpen(false)
                              setSelectedAuditor("")
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={handleAssignAuditor} disabled={!selectedAuditor}>
                              Assign Auditor
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  {assignedAuditors.length > 0 ? (
                    <div className="space-y-2">
                      {assignedAuditors.map((auditor) => (
                        <div key={auditor?.id} className="flex items-center space-x-3 p-2 hover:bg-accent rounded-lg transition-colors">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-semibold">
                              {auditor?.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{auditor?.name}</p>
                            <p className="text-xs text-muted-foreground">{auditor?.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No auditors assigned
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Findings</span>
                  <span className="text-xl font-bold">{audit.findings?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Open Findings</span>
                  <span className="text-xl font-bold text-red-600">
                    {audit.findings?.filter(f => f.status === 'open').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resolved</span>
                  <span className="text-xl font-bold text-green-600">
                    {audit.findings?.filter(f => f.status === 'resolved').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Team Size</span>
                  <span className="text-xl font-bold">
                    {audit.assignedAuditors.length + 1}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Audit Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(audit.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

