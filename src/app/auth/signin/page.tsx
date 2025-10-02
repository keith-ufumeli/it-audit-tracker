"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Shield, Users, Building, UserCheck } from "lucide-react"

const mockUsers = [
  {
    email: "manager@audit.com",
    name: "John Manager",
    role: "Audit Manager",
    icon: Shield,
    description: "Create audits, assign tasks, generate reports"
  },
  {
    email: "auditor@audit.com",
    name: "Jane Auditor",
    role: "Auditor",
    icon: UserCheck,
    description: "Access logs, submit reports, request documents"
  },
  {
    email: "management@audit.com",
    name: "Bob Executive",
    role: "Management",
    icon: Users,
    description: "View dashboards, approve reports"
  },
  {
    email: "client@company.com",
    name: "Alice Client",
    role: "Client",
    icon: Building,
    description: "View notifications, respond to requests"
  },
  {
    email: "dept@company.com",
    name: "Charlie Department",
    role: "Department",
    icon: Building,
    description: "Upload documents, view requests"
  }
]

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        // Get session to determine redirect
        const session = await getSession()
        if (session?.user?.role) {
          // Redirect based on role
          const role = session.user.role
          if (["audit_manager", "auditor", "management"].includes(role)) {
            router.push("/admin/dashboard")
          } else {
            router.push("/client")
          }
        } else {
          // Fallback redirect
          router.push("/")
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail)
    setPassword("password") // Default password for all mock users
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-oxford_blue-500 via-oxford_blue-600 to-oxford_blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8">
        {/* Left side - Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your IT Audit Trail Tracker account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Default password for all accounts: <strong>password</strong></p>
            </div>
          </CardContent>
        </Card>

        {/* Right side - Demo Accounts */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Demo Accounts</h2>
            <p className="text-oxford_blue-200">
              Click on any account below to auto-fill credentials and explore different user roles.
            </p>
          </div>
          
          <div className="space-y-4">
            {mockUsers.map((user) => {
              const Icon = user.icon
              return (
                <Card 
                  key={user.email}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-white/10 backdrop-blur-sm border-white/20"
                  onClick={() => fillCredentials(user.email)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange_web-500 rounded-lg">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white">{user.name}</h3>
                          <Badge variant="secondary" className="bg-orange_web-500 text-white">
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-oxford_blue-200 mt-1">
                          {user.description}
                        </p>
                        <p className="text-xs text-oxford_blue-300 mt-1">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
