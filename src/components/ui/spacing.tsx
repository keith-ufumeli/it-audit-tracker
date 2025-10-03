import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spacingVariants = cva("", {
  variants: {
    size: {
      xs: "space-y-1",
      sm: "space-y-2",
      md: "space-y-4",
      lg: "space-y-6",
      xl: "space-y-8",
      "2xl": "space-y-12",
    },
    direction: {
      vertical: "flex flex-col",
      horizontal: "flex flex-row",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
  },
  defaultVariants: {
    size: "md",
    direction: "vertical",
    align: "stretch",
    justify: "start",
  },
})

export interface SpacingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spacingVariants> {}

const Spacing = React.forwardRef<HTMLDivElement, SpacingProps>(
  ({ className, size, direction, align, justify, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          spacingVariants({ size, direction, align, justify }),
          className
        )}
        {...props}
      />
    )
  }
)
Spacing.displayName = "Spacing"

export { Spacing, spacingVariants }
