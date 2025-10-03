import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { Shield } from "lucide-react"

const loaderVariants = cva(
  "animate-spin rounded-full border-2 border-solid",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-t-2",
        md: "h-6 w-6 border-t-2",
        lg: "h-8 w-8 border-t-2",
        xl: "h-12 w-12 border-t-4",
        "2xl": "h-16 w-16 border-t-4",
      },
      variant: {
        default: "border-muted border-t-primary",
        primary: "border-muted border-t-primary",
        secondary: "border-muted border-t-secondary",
        accent: "border-muted border-t-accent",
        destructive: "border-muted border-t-destructive",
        orange: "border-muted border-t-orange_web-500",
        blue: "border-muted border-t-oxford_blue-500",
        white: "border-white/20 border-t-white",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

export interface LoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loaderVariants> {
  text?: string
  showText?: boolean
}

export function Loader({ 
  className, 
  size, 
  variant, 
  text = "Loading...", 
  showText = false,
  ...props 
}: LoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)} {...props}>
      <div className={cn(loaderVariants({ size, variant }))} />
      {showText && (
        <p className="mt-2 text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

// Pulse loader variant
export function PulseLoader({ 
  className, 
  text = "Loading...", 
  showText = false,
  ...props 
}: Omit<LoaderProps, 'size' | 'variant'>) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)} {...props}>
      <div className="flex space-x-1">
        <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
      </div>
      {showText && (
        <p className="mt-2 text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

// Skeleton loader
export function SkeletonLoader({ 
  className, 
  lines = 3,
  ...props 
}: Omit<LoaderProps, 'size' | 'variant' | 'text' | 'showText'> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-muted rounded animate-pulse",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

// Card skeleton loader
export function CardSkeleton({ className, ...props }: Omit<LoaderProps, 'size' | 'variant' | 'text' | 'showText'>) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)} {...props}>
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded animate-pulse w-full" />
          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
        </div>
        <div className="h-8 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}

// Table skeleton loader
export function TableSkeleton({ 
  className, 
  rows = 5, 
  columns = 4,
  ...props 
}: Omit<LoaderProps, 'size' | 'variant' | 'text' | 'showText'> & { rows?: number; columns?: number }) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className={cn(
                "h-4 bg-muted rounded animate-pulse flex-1",
                colIndex === columns - 1 ? "w-1/2" : "w-full"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Full page loader
export function FullPageLoader({ 
  text = "Loading...", 
  variant = "primary",
  showLogo = false,
  subtitle,
  ...props 
}: Omit<LoaderProps, 'size' | 'showText'> & { 
  showLogo?: boolean
  subtitle?: string 
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" {...props}>
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        {showLogo && (
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-orange_web-500 rounded-full shadow-lg animate-pulse">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <Loader size="2xl" variant={variant} />
          <div className="space-y-2">
            <p className="text-xl font-semibold text-foreground animate-pulse">
              {text}
            </p>
            {subtitle && (
              <p className="text-sm text-muted-foreground animate-pulse">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="w-48 mx-auto">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange_web-500 to-oxford_blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Authentication redirect loader
export function AuthRedirectLoader({ 
  text = "Redirecting to Sign In...", 
  subtitle = "Please wait while we redirect you to the login page",
  ...props 
}: Omit<LoaderProps, 'size' | 'variant' | 'showText'> & { 
  text?: string
  subtitle?: string 
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-oxford_blue-500 via-oxford_blue-600 to-oxford_blue-700 flex items-center justify-center p-4" {...props}>
      <div className="text-center space-y-8 animate-in fade-in duration-700">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="p-6 bg-orange_web-500 rounded-full shadow-2xl animate-pulse">
            <Shield className="h-16 w-16 text-white" />
          </div>
        </div>
        
        {/* App Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">IT Audit Tracker</h1>
          <p className="text-white/90">Secure Audit Management System</p>
        </div>
        
        {/* Loading Content */}
        <div className="space-y-6">
          <Loader size="2xl" variant="white" />
          <div className="space-y-3">
            <p className="text-xl font-semibold text-white animate-pulse">
              {text}
            </p>
            <p className="text-sm text-white/90 animate-pulse">
              {subtitle}
            </p>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange_web-400 to-white rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Security badge */}
        <div className="flex justify-center">
          <div className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full border border-white/30">
            <p className="text-xs text-white font-medium">🔒 Secure Connection</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Authentication state loader (for signin/signout)
export function AuthStateLoader({ 
  text = "Signing in...", 
  subtitle = "Please wait while we authenticate your credentials",
  ...props 
}: Omit<LoaderProps, 'size' | 'variant' | 'showText'> & { 
  text?: string
  subtitle?: string 
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-oxford_blue-500 via-oxford_blue-600 to-oxford_blue-700 flex items-center justify-center p-4" {...props}>
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="p-4 bg-orange_web-500 rounded-full shadow-lg animate-pulse">
            <Shield className="h-12 w-12 text-white" />
          </div>
        </div>
        
        {/* Loading Content */}
        <div className="space-y-4">
          <Loader size="2xl" variant="white" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white animate-pulse">
              {text}
            </p>
            <p className="text-sm text-white/90 animate-pulse">
              {subtitle}
            </p>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="w-48 mx-auto">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange_web-400 to-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline loader for buttons
export function InlineLoader({ className, ...props }: Omit<LoaderProps, 'size' | 'variant' | 'text' | 'showText'>) {
  return (
    <div className={cn("inline-flex items-center", className)} {...props}>
      <Loader size="sm" variant="white" />
    </div>
  )
}
