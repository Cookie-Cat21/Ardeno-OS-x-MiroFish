import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-[13px] font-medium leading-none tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none md:text-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[linear-gradient(180deg,#ff6628_0%,#ff4f00_100%)] text-primary-foreground shadow-[0_20px_42px_-20px_rgba(255,79,0,0.78),inset_0_1px_0_rgba(255,255,255,0.16)] hover:-translate-y-[1px] hover:shadow-[0_28px_58px_-22px_rgba(255,79,0,0.72)]",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_16px_34px_-18px_rgba(220,38,38,0.8)] hover:-translate-y-0.5 hover:bg-destructive/90",
        outline: "border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:-translate-y-[1px] hover:border-primary/20 hover:bg-primary/[0.085] hover:text-foreground hover:shadow-[0_16px_38px_-28px_rgba(255,79,0,0.5)]",
        secondary: "bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 hover:bg-secondary/80",
        ghost: "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground hover:-translate-y-[1px]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2 md:px-5",
        sm: "h-9 rounded-[12px] px-3 text-[12px]",
        lg: "h-12 rounded-[16px] px-5 text-sm md:px-6 md:text-[15px]",
        icon: "h-11 w-11 rounded-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
