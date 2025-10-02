"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FullPageLoader } from "@/components/ui/loader"
import { Shield, Building, ArrowRight, Users, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (session?.user?.role) {
      // Redirect authenticated users to their appropriate portal
      const role = session.user.role
      if (["audit_manager", "auditor", "management"].includes(role)) {
        router.push("/admin/dashboard")
      } else {
        router.push("/client")
      }
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <FullPageLoader 
        text="Initializing Audit Tracker..." 
        variant="white"
        className="bg-gradient-to-br from-oxford_blue-500 via-oxford_blue-600 to-oxford_blue-700"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-oxford_blue-500 via-oxford_blue-600 to-oxford_blue-700">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-orange_web-500" />
            <h1 className="text-2xl font-bold text-white">IT Audit Trail Tracker</h1>
          </div>
          <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Link href="/auth/signin">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Comprehensive Audit Management
          </h2>
          <p className="text-xl text-oxford_blue-200 mb-8 max-w-3xl mx-auto">
            Enhance transparency, accountability, and security with our systematic audit trail tracking system. 
            Manage audits, monitor activities, and ensure compliance across your organization.
          </p>
          <Button asChild size="lg" className="bg-orange_web-500 hover:bg-orange_web-600 text-white">
            <Link href="/auth/signin">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Shield className="h-8 w-8 text-orange_web-500 mb-2" />
              <CardTitle className="text-white">Admin Portal</CardTitle>
              <CardDescription className="text-oxford_blue-200">
                For Audit Managers, Auditors, and Management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-oxford_blue-200">
                <li>• Create and assign audit tasks</li>
                <li>• Monitor system activities</li>
                <li>• Generate comprehensive reports</li>
                <li>• Manage user permissions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Building className="h-8 w-8 text-orange_web-500 mb-2" />
              <CardTitle className="text-white">Client Portal</CardTitle>
              <CardDescription className="text-oxford_blue-200">
                For Clients and Departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-oxford_blue-200">
                <li>• Receive audit notifications</li>
                <li>• Upload requested documents</li>
                <li>• Track audit progress</li>
                <li>• Respond to audit requests</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-orange_web-500 mb-2" />
              <CardTitle className="text-white">Analytics & Reporting</CardTitle>
              <CardDescription className="text-oxford_blue-200">
                Comprehensive insights and compliance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-oxford_blue-200">
                <li>• Real-time activity monitoring</li>
                <li>• Compliance score tracking</li>
                <li>• Automated report generation</li>
                <li>• Risk assessment tools</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Demo Accounts */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Try Demo Accounts</CardTitle>
            <CardDescription className="text-oxford_blue-200 text-center">
              Explore different user roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Users className="h-6 w-6 text-orange_web-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Audit Manager</p>
                <p className="text-xs text-oxford_blue-300">manager@audit.com</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <FileText className="h-6 w-6 text-orange_web-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Auditor</p>
                <p className="text-xs text-oxford_blue-300">auditor@audit.com</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Shield className="h-6 w-6 text-orange_web-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Management</p>
                <p className="text-xs text-oxford_blue-300">management@audit.com</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Building className="h-6 w-6 text-orange_web-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Client</p>
                <p className="text-xs text-oxford_blue-300">client@company.com</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Building className="h-6 w-6 text-orange_web-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Department</p>
                <p className="text-xs text-oxford_blue-300">dept@company.com</p>
              </div>
            </div>
            <p className="text-center text-sm text-oxford_blue-300 mt-4">
              Password for all accounts: <strong>password</strong>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
