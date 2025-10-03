"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FullPageLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Users,
  CheckCircle,
  XCircle
} from "lucide-react"
import { isSuperAdmin } from "@/lib/auth"

interface Permission {
  id: string
  name: string
  description: string
  category: string
  isSystemPermission: boolean
}

interface RolePermissions {
  role: string
  permissions: string[]
}

export default function PermissionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    category: "",
    isSystemPermission: false
  })

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (!isSuperAdmin(session.user.role)) {
      router.push("/admin/dashboard")
      return
    }

    loadData()
  }, [session, status, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [permissionsRes, rolesRes] = await Promise.all([
        fetch("/api/permissions"),
        fetch("/api/roles")
      ])

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json()
        setPermissions(permissionsData.permissions)
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setRolePermissions(rolesData.rolePermissions)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load permissions data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePermission = async () => {
    try {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Permission created successfully"
        })
        setIsCreateDialogOpen(false)
        setFormData({ id: "", name: "", description: "", category: "", isSystemPermission: false })
        loadData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create permission",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating permission:", error)
      toast({
        title: "Error",
        description: "Failed to create permission",
        variant: "destructive"
      })
    }
  }

  const handleUpdatePermission = async () => {
    if (!selectedPermission) return

    try {
      const response = await fetch(`/api/permissions/${selectedPermission.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Permission updated successfully"
        })
        setIsEditDialogOpen(false)
        setSelectedPermission(null)
        setFormData({ id: "", name: "", description: "", category: "", isSystemPermission: false })
        loadData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update permission",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating permission:", error)
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive"
      })
    }
  }

  const handleDeletePermission = async () => {
    if (!selectedPermission) return

    try {
      const response = await fetch(`/api/permissions/${selectedPermission.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Permission deleted successfully"
        })
        setIsDeleteDialogOpen(false)
        setSelectedPermission(null)
        loadData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete permission",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting permission:", error)
      toast({
        title: "Error",
        description: "Failed to delete permission",
        variant: "destructive"
      })
    }
  }

  const handleUpdateRolePermissions = async (role: string, newPermissions: string[]) => {
    try {
      const response = await fetch("/api/roles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role,
          permissions: newPermissions
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role permissions updated successfully"
        })
        loadData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update role permissions",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating role permissions:", error)
      toast({
        title: "Error",
        description: "Failed to update role permissions",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (permission: Permission) => {
    setSelectedPermission(permission)
    setFormData({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      category: permission.category,
      isSystemPermission: permission.isSystemPermission
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (permission: Permission) => {
    setSelectedPermission(permission)
    setIsDeleteDialogOpen(true)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "system":
        return "bg-red-500"
      case "user_management":
        return "bg-blue-500"
      case "audit_management":
        return "bg-green-500"
      case "reporting":
        return "bg-purple-500"
      case "monitoring":
        return "bg-orange-500"
      case "data_management":
        return "bg-cyan-500"
      default:
        return "bg-gray-500"
    }
  }

  const categories = ["all", ...Array.from(new Set(permissions.map(p => p.category)))]

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || permission.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (status === "loading" || loading) {
    return (
      <FullPageLoader 
        text="Loading Permissions..." 
        variant="primary"
      />
    )
  }

  if (!session || !isSuperAdmin(session.user.role)) {
    return null
  }

  return (
    <AdminLayout>
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Permission Management</h1>
                <p className="text-muted-foreground">Manage system permissions and role assignments</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Permission
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Permission</DialogTitle>
                  <DialogDescription>
                    Create a new system permission with appropriate category.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create-id">Permission ID</Label>
                    <Input
                      id="create-id"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      placeholder="e.g., manage_custom_feature"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-name">Name</Label>
                    <Input
                      id="create-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Manage Custom Feature"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-description">Description</Label>
                    <Input
                      id="create-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of what this permission allows"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="user_management">User Management</SelectItem>
                        <SelectItem value="audit_management">Audit Management</SelectItem>
                        <SelectItem value="reporting">Reporting</SelectItem>
                        <SelectItem value="monitoring">Monitoring</SelectItem>
                        <SelectItem value="data_management">Data Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePermission}>
                    Create Permission
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="roles">Role Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search permissions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Permissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPermissions.map((permission) => (
                <Card key={permission.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-lg">{permission.name}</CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {permission.id}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!permission.isSystemPermission && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(permission)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(permission)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={`${getCategoryColor(permission.category)} text-white`}>
                        {permission.category.replace("_", " ")}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {permission.isSystemPermission ? (
                          <CheckCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {permission.isSystemPermission ? "System" : "Custom"}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {permission.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPermissions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No permissions found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || selectedCategory !== "all" 
                      ? "Try adjusting your search criteria" 
                      : "No permissions have been created yet"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Role Permission Assignments
                </CardTitle>
                <CardDescription>
                  Manage which permissions are assigned to each role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {rolePermissions.map((rolePermission) => (
                    <div key={rolePermission.role} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold capitalize">
                          {rolePermission.role.replace("_", " ")}
                        </h3>
                        <Badge variant="outline">
                          {rolePermission.permissions.length} permissions
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {permissions.map((permission) => {
                          const isAssigned = rolePermission.permissions.includes(permission.id)
                          const isDisabled = rolePermission.role === "super_admin" || permission.isSystemPermission
                          
                          return (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${rolePermission.role}-${permission.id}`}
                                checked={isAssigned}
                                disabled={isDisabled}
                                onCheckedChange={(checked) => {
                                  const newPermissions = checked
                                    ? [...rolePermission.permissions, permission.id]
                                    : rolePermission.permissions.filter(p => p !== permission.id)
                                  handleUpdateRolePermissions(rolePermission.role, newPermissions)
                                }}
                              />
                              <Label 
                                htmlFor={`${rolePermission.role}-${permission.id}`}
                                className={`text-sm ${isDisabled ? "text-muted-foreground" : ""}`}
                              >
                                {permission.name}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Update permission information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="user_management">User Management</SelectItem>
                  <SelectItem value="audit_management">Audit Management</SelectItem>
                  <SelectItem value="reporting">Reporting</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="data_management">Data Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePermission}>
              Update Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this permission? This action cannot be undone and will remove the permission from all roles.
            </DialogDescription>
          </DialogHeader>
          {selectedPermission && (
            <div className="py-4">
              <p className="font-medium">{selectedPermission.name}</p>
              <p className="text-sm text-muted-foreground font-mono">{selectedPermission.id}</p>
              <p className="text-sm text-muted-foreground">{selectedPermission.description}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePermission}>
              Delete Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
