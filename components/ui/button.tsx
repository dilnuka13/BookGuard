import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "brandGradient";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const variantClasses = {
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
      outline:
        "border border-border bg-card text-foreground hover:bg-muted/70 active:scale-[0.98]",
      ghost:
        "text-foreground hover:bg-muted/60 active:scale-[0.98]",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm active:scale-[0.98]",
      brandGradient:
        "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-semibold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:opacity-95 active:scale-[0.98]",
    }[variant];

    const sizeClasses = {
      default: "h-11 px-5 py-2.5 text-sm rounded-xl min-h-[44px]",
      sm: "h-10 px-3.5 text-xs rounded-lg min-h-[40px] sm:min-h-[44px]",
      lg: "h-13 px-7 text-base rounded-2xl min-h-[52px]",
      icon: "h-11 w-11 rounded-xl min-h-[44px] min-w-[44px] p-0 flex items-center justify-center",
    }[size];

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantClasses,
          sizeClasses,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
