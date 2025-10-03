"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FullPageLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { 
  Settings, 
  Users, 
  Shield, 
  Database, 
  Bell, 
  FileText, 
  Monitor,
  Plug,
  Save,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import { isSuperAdmin } from "@/lib/auth"

interface SystemSettings {
  database: any
  security: any
  notifications: any
  audit: any
  reporting: any
  system: any
  integrations: any
}

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

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("system")
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      const [settingsRes, permissionsRes, rolesRes, usersRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/permissions"),
        fetch("/api/roles"),
        fetch("/api/users")
      ])

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings(settingsData.settings)
      }

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json()
        setPermissions(permissionsData.permissions)
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setRolePermissions(rolesData.rolePermissions)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load settings data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (section: string, newSettings: any) => {
    try {
      setSaving(true)
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          section,
          settings: newSettings
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${section} settings updated successfully`
        })
        loadData() // Reload data
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update settings",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "reset_to_defaults"
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings reset to defaults successfully"
        })
        loadData() // Reload data
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to reset settings",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error resetting settings:", error)
      toast({
        title: "Error",
        description: "Failed to reset settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <FullPageLoader 
        text="Loading Settings..." 
        variant="primary"
      />
    )
  }

  if (!session || !isSuperAdmin(session.user.role)) {
    return null
  }

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Configure general system settings and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="maintenanceMode"
                checked={settings?.system?.maintenanceMode || false}
                onCheckedChange={(checked) => {
                  const newSettings = { ...settings?.system, maintenanceMode: checked }
                  updateSettings("system", newSettings)
                }}
              />
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="debugMode"
                checked={settings?.system?.debugMode || false}
                onCheckedChange={(checked) => {
                  const newSettings = { ...settings?.system, debugMode: checked }
                  updateSettings("system", newSettings)
                }}
              />
              <Label htmlFor="debugMode">Debug Mode</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logLevel">Log Level</Label>
              <Select 
                value={settings?.system?.logLevel || "info"}
                onValueChange={(value) => {
                  const newSettings = { ...settings?.system, logLevel: value }
                  updateSettings("system", newSettings)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxFileUploadSize">Max File Upload Size (MB)</Label>
              <Input
                id="maxFileUploadSize"
                type="number"
                value={settings?.system?.maxFileUploadSizeMB || 50}
                onChange={(e) => {
                  const newSettings = { ...settings?.system, maxFileUploadSizeMB: parseInt(e.target.value) }
                  updateSettings("system", newSettings)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings?.security?.sessionTimeoutMinutes || 60}
                onChange={(e) => {
                  const newSettings = { ...settings?.security, sessionTimeoutMinutes: parseInt(e.target.value) }
                  updateSettings("security", newSettings)
                }}
              />
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings?.security?.maxLoginAttempts || 5}
                onChange={(e) => {
                  const newSettings = { ...settings?.security, maxLoginAttempts: parseInt(e.target.value) }
                  updateSettings("security", newSettings)
                }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passwordMinLength">Password Min Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings?.security?.passwordMinLength || 8}
                onChange={(e) => {
                  const newSettings = { ...settings?.security, passwordMinLength: parseInt(e.target.value) }
                  updateSettings("security", newSettings)
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="requirePasswordComplexity"
                checked={settings?.security?.requirePasswordComplexity || false}
                onCheckedChange={(checked) => {
                  const newSettings = { ...settings?.security, requirePasswordComplexity: checked }
                  updateSettings("security", newSettings)
                }}
              />
              <Label htmlFor="requirePasswordComplexity">Require Password Complexity</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderUserManagement = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Active Users ({users.length})</h3>
              <Button onClick={() => router.push("/admin/users")}>
                Manage Users
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.slice(0, 6).map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{user.name}</h4>
                      <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                        {user.role.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPermissionManagement = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Management
          </CardTitle>
          <CardDescription>
            Manage system permissions and role assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Available Permissions ({permissions.length})</h3>
              <Button onClick={() => router.push("/admin/permissions")}>
                Manage Permissions
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissions.slice(0, 8).map((permission) => (
                <Card key={permission.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{permission.name}</h4>
                      <Badge variant={permission.isSystemPermission ? "destructive" : "secondary"}>
                        {permission.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Current permission assignments for each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rolePermissions.map((rolePermission) => (
              <div key={rolePermission.role} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{rolePermission.role.replace("_", " ")}</h4>
                  <Badge variant="outline">{rolePermission.permissions.length} permissions</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {rolePermission.permissions.slice(0, 5).map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission.replace(/_/g, " ")}
                    </Badge>
                  ))}
                  {rolePermission.permissions.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{rolePermission.permissions.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Settings className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">System Settings</h1>
                <p className="text-muted-foreground">Configure system-wide settings and permissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={resetToDefaults}
                disabled={saving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button 
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            {renderSystemSettings()}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {renderUserManagement()}
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            {renderPermissionManagement()}
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Configuration
                </CardTitle>
                <CardDescription>
                  Configure database settings and maintenance options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="backupEnabled"
                      checked={settings?.database?.backupEnabled || false}
                      onCheckedChange={(checked) => {
                        const newSettings = { ...settings?.database, backupEnabled: checked }
                        updateSettings("database", newSettings)
                      }}
                    />
                    <Label htmlFor="backupEnabled">Enable Automatic Backups</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <Select 
                        value={settings?.database?.backupFrequency || "daily"}
                        onValueChange={(value) => {
                          const newSettings = { ...settings?.database, backupFrequency: value }
                          updateSettings("database", newSettings)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                      <Input
                        id="backupRetention"
                        type="number"
                        value={settings?.database?.backupRetentionDays || 30}
                        onChange={(e) => {
                          const newSettings = { ...settings?.database, backupRetentionDays: parseInt(e.target.value) }
                          updateSettings("database", newSettings)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
