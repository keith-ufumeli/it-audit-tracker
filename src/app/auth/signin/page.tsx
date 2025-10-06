"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

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
          if (["super_admin", "audit_manager", "auditor", "management"].includes(role)) {
            router.push("/admin/dashboard")
          } else {
            router.push("/client")
          }
        } else {
          // Fallback redirect
          router.push("/")
        }
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-oxford_blue-500 via-oxford_blue-600 to-oxford_blue-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white">
              <Image 
                src="/logo.png" 
                alt="Audit Tracker Logo" 
                width={64} 
                height={64}
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">IT Audit Tracker</CardTitle>
          <CardDescription>
            Sign in to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-orange_web-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-orange_web-500/20 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-orange_web-500 hover:bg-orange_web-600 text-white" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          {/* <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Demo password: <span className="font-medium">password</span></p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  )
}
