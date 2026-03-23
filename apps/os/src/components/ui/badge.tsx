import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium leading-none tracking-[0.08em] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 md:text-[11px]",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/12 text-primary hover:bg-primary/18",
        secondary: "border-white/10 bg-white/[0.035] text-secondary-foreground hover:bg-white/[0.06]",
        destructive: "border-destructive/20 bg-destructive/12 text-destructive hover:bg-destructive/18",
        outline: "border-white/12 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
