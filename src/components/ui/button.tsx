import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-md hover:shadow-lg hover:scale-105",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl shadow-md hover:shadow-lg",
        outline: "border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground rounded-2xl shadow-sm hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-2xl shadow-md hover:shadow-lg hover:scale-105",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-2xl",
        link: "text-primary underline-offset-4 hover:underline",
        magical: "bg-gradient-to-r from-primary via-primary-glow to-accent text-primary-foreground rounded-2xl shadow-[var(--shadow-magical)] hover:shadow-xl hover:scale-105 animate-gradient",
        warm: "bg-gradient-to-r from-secondary to-accent text-secondary-foreground rounded-2xl shadow-[var(--shadow-warm)] hover:shadow-xl hover:scale-105",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-16 rounded-2xl px-10 text-lg",
        icon: "h-12 w-12 rounded-2xl",
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
