import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "emerald" | "cyan" | "destructive";
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border text-foreground",
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
    cyan: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25",
    destructive: "bg-destructive/15 text-destructive border border-destructive/25",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variantClasses,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
