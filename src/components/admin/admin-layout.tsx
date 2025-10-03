"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  Activity,
  BarChart3,
  LogOut,
  Menu,
  Bell,
  User,
  Settings,
  ChevronRight,
  Users,
  Key
} from "lucide-react"
import { NotificationDropdown } from "@/components/ui/notification-dropdown"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permission: null },
    { name: "Audits", href: "/admin/audits", icon: ClipboardCheck, permission: "create_audit" },
    { name: "Reports", href: "/admin/reports", icon: FileText, permission: "view_reports" },
    { name: "Schedule Reports", href: "/admin/reports/schedule", icon: Settings, permission: "view_reports" },
    { name: "Notifications", href: "/admin/notifications", icon: Bell, permission: null },
    { name: "Activity Logs", href: "/admin/activities", icon: Activity, permission: "view_logs" },
    { name: "Security Alerts", href: "/admin/alerts", icon: Shield, permission: "view_logs" },
    { name: "Management", href: "/admin/management", icon: BarChart3, permission: "view_dashboards" },
    { name: "User Management", href: "/admin/users", icon: Users, permission: "manage_all_users" },
    { name: "Permissions", href: "/admin/permissions", icon: Key, permission: "manage_permissions" },
    { name: "System Settings", href: "/admin/settings", icon: Settings, permission: "manage_system_settings" },
  ]

  const filteredNavigation = navigation.filter(item => 
    !item.permission || session?.user.permissions.includes(item.permission)
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-red-500"
      case "audit_manager": return "bg-orange-500"
      case "auditor": return "bg-blue-500"
      case "management": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin": return "Super Admin"
      case "audit_manager": return "Audit Manager"
      case "auditor": return "Auditor"
      case "management": return "Management"
      default: return role
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-card border-r shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b bg-gradient-to-r from-orange-50/50 to-orange-100/30">
        <div className="flex items-center space-x-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Audit Tracker
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.name}
              onClick={() => {
                router.push(item.href)
                setMobileOpen(false)
              }}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-300 group relative overflow-hidden
                ${isActive 
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:-translate-y-0.5"
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`h-5 w-5 transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:rotate-3"}`} />
                <span className="font-medium">{item.name}</span>
              </div>
              {isActive && <ChevronRight className="h-4 w-4 animate-pulse" />}
            </button>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-background border shadow-sm hover:shadow-md transition-all duration-200">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{session?.user.name}</p>
            <Badge className={`${getRoleColor(session?.user.role || "")} text-white text-xs mt-1 hover:scale-105 transition-transform duration-200`}>
              {getRoleDisplayName(session?.user.role || "")}
            </Badge>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-3 justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-[1.02] rounded-xl"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <Sidebar />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar />
              </SheetContent>
            </Sheet>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-orange-500" />
              <span className="font-bold">Audit Tracker</span>
            </div>
          </div>
          {session && (
            <NotificationDropdown 
              userId={session.user.id} 
              userRole={session.user.role}
              portalType="admin"
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="md:pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}

