import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

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
  ...props 
}: Omit<LoaderProps, 'size' | 'showText'>) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" {...props}>
      <div className="text-center">
        <Loader size="2xl" variant={variant} />
        <p className="mt-4 text-lg text-muted-foreground animate-pulse">
          {text}
        </p>
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
