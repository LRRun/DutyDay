"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva("ui-button", { variants: {
  variant: { primary: "ui-button-primary", secondary: "ui-button-secondary", ghost: "ui-button-ghost", danger: "ui-button-danger" },
  size: { default: "ui-button-default", sm: "ui-button-sm", icon: "ui-button-icon" },
}, defaultVariants: { variant: "secondary", size: "default" } });

export function Button({ className, variant, size, asChild = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
