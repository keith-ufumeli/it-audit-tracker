import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground",
      h2: "scroll-m-20 border-b border-border pb-2 text-3xl font-semibold tracking-tight first:mt-0 text-foreground",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight text-foreground",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight text-foreground",
      h5: "scroll-m-20 text-lg font-semibold tracking-tight text-foreground",
      h6: "scroll-m-20 text-base font-semibold tracking-tight text-foreground",
      p: "leading-7 text-foreground [&:not(:first-child)]:mt-6",
      blockquote: "mt-6 border-l-2 border-border pl-6 italic text-muted-foreground",
      list: "my-6 ml-6 list-disc [&>li]:mt-2 text-foreground",
      inlineCode: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground",
      lead: "text-xl text-muted-foreground leading-relaxed",
      large: "text-lg font-semibold text-foreground",
      small: "text-sm font-medium leading-none text-muted-foreground",
      muted: "text-sm text-muted-foreground leading-relaxed",
    },
  },
  defaultVariants: {
    variant: "p",
  },
})

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: React.ElementType
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, as, ...props }, ref) => {
    const Comp = as || (variant === "inlineCode" ? "code" : variant === "blockquote" ? "blockquote" : "div")
    return (
      <Comp
        className={cn(typographyVariants({ variant, className }))}
        ref={ref as any}
        {...props}
      />
    )
  }
)
Typography.displayName = "Typography"

export { Typography, typographyVariants }
