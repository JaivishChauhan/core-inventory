import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/90 text-primary-foreground hover:bg-primary",
        secondary:
          "border-border/70 bg-background/55 text-foreground hover:bg-accent/80",
        destructive:
          "border-rose-500/35 bg-rose-500/12 text-rose-200 hover:bg-rose-500/18",
        outline: "border-border/65 bg-transparent text-muted-foreground",
        success:
          "border-emerald-500/30 bg-emerald-500/12 text-emerald-200 hover:bg-emerald-500/18",
        warning:
          "border-amber-400/30 bg-amber-400/12 text-amber-100 hover:bg-amber-400/18",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
