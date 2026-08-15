"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px]",
  {
    variants: {
      variant: {
        default: "bg-[#1D9E75] text-white hover:bg-[#0F6E56] focus-visible:ring-[#1D9E75]",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-[#E8E4DB] bg-white text-gray-900 hover:bg-[#F7F5F0]",
        secondary: "bg-[#F7F5F0] text-gray-900 hover:bg-[#E8E4DB]",
        ghost: "hover:bg-[#F7F5F0] text-gray-700",
        link: "text-[#1D9E75] underline-offset-4 hover:underline min-h-0",
        gold: "bg-[#EF9F27] text-white hover:bg-[#BA7517]",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 min-h-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
