"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  variant?: "inline" | "segmented" | "button";
  className?: string;
}

export function ThemeToggle({ variant = "segmented", className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch by rendering a placeholder
    return (
      <div
        className={cn(
          variant === "button"
            ? "h-9 w-9 rounded-xl bg-muted/50 animate-pulse"
            : "h-10 w-full rounded-xl bg-muted/50 animate-pulse",
          className
        )}
      />
    );
  }

  if (variant === "button") {
    const isDark = resolvedTheme === "dark";
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-foreground transition-all duration-200 hover:bg-muted hover:border-primary/40 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm",
          className
        )}
        aria-label="Toggle theme"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-slate-700 dark:text-cyan-400 transition-transform duration-200 hover:-rotate-12" />
        )}
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      className={cn(
        "grid grid-cols-3 h-10 w-full items-center rounded-xl border border-border/70 bg-muted/60 p-1 text-muted-foreground shadow-sm",
        className
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        onClick={() => setTheme("light")}
        className={cn(
          "flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-200",
          theme === "light"
            ? "bg-card text-foreground shadow-sm font-semibold scale-[1.02]"
            : "hover:text-foreground hover:bg-card/40"
        )}
        title="Light theme"
      >
        <Sun className={cn("h-3.5 w-3.5 shrink-0", theme === "light" ? "text-amber-500" : "text-muted-foreground")} />
        <span className="text-[11px] font-medium">Light</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={cn(
          "flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-200",
          theme === "dark"
            ? "bg-card text-foreground shadow-sm font-semibold scale-[1.02]"
            : "hover:text-foreground hover:bg-card/40"
        )}
        title="Dark theme"
      >
        <Moon className={cn("h-3.5 w-3.5 shrink-0", theme === "dark" ? "text-cyan-400" : "text-muted-foreground")} />
        <span className="text-[11px] font-medium">Dark</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "system"}
        onClick={() => setTheme("system")}
        className={cn(
          "flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-200",
          theme === "system"
            ? "bg-card text-foreground shadow-sm font-semibold scale-[1.02]"
            : "hover:text-foreground hover:bg-card/40"
        )}
        title="System theme"
      >
        <Monitor className={cn("h-3.5 w-3.5 shrink-0", theme === "system" ? "text-emerald-500" : "text-muted-foreground")} />
        <span className="text-[11px] font-medium">System</span>
      </button>
    </div>
  );
}

