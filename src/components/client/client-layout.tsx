"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  Building, 
  LayoutDashboard, 
  FileText, 
  Bell,
  LogOut,
  Menu,
  Upload,
  User,
  ChevronRight
} from "lucide-react"
import Image from "next/image"
import { NotificationDropdown } from "@/components/ui/notification-dropdown"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
    { name: "Documents", href: "/client/documents", icon: FileText },
    { name: "Notifications", href: "/client/notifications", icon: Bell },
  ]

  const getRoleColor = (role: string) => {
    switch (role) {
      case "client": return "bg-blue-500"
      case "department": return "bg-cyan-500"
      default: return "bg-gray-500"
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "client": return "Client"
      case "department": return "Department"
      default: return role
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-card border-r shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50/50 to-blue-100/30">
        <div className="flex items-center space-x-3">
          <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-200">
            <Image 
              src="/logo.png" 
              alt="Audit Tracker Logo" 
              width={28} 
              height={28}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Client Portal
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Audit Tracker</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
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
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25" 
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
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{session?.user.name}</p>
            <Badge className={`${getRoleColor(session?.user.role || "")} text-white text-xs mt-1 hover:scale-105 transition-transform duration-200`}>
              {getRoleDisplayName(session?.user.role || "")}
            </Badge>
          </div>
        </div>
        {session?.user.department && (
          <div className="mt-2 text-xs text-muted-foreground text-center font-medium">
            {session.user.department}
          </div>
        )}
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
              <div className="h-6 w-6 rounded bg-white flex items-center justify-center border border-blue-200">
                <Image 
                  src="/logo.png" 
                  alt="Audit Tracker Logo" 
                  width={20} 
                  height={20}
                  className="object-contain"
                />
              </div>
              <span className="font-bold">Client Portal</span>
            </div>
          </div>
          {session && (
            <NotificationDropdown 
              userId={session.user.id} 
              userRole={session.user.role}
              portalType="client"
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

