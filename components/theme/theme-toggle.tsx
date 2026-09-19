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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch by rendering a placeholder
    return (
      <div
        className={cn(
          "h-11 w-full max-w-[200px] rounded-xl bg-muted/50 animate-pulse",
          className
        )}
      />
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary",
          className
        )}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-amber-400" />
        ) : (
          <Moon className="h-5 w-5 text-slate-700" />
        )}
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      className={cn(
        "inline-flex h-11 items-center rounded-xl border border-border bg-muted/60 p-1 text-muted-foreground",
        className
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        onClick={() => setTheme("light")}
        className={cn(
          "flex h-9 min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all",
          theme === "light"
            ? "bg-card text-foreground shadow-sm"
            : "hover:text-foreground"
        )}
        title="Light theme"
      >
        <Sun className="h-4 w-4 text-amber-500" />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={cn(
          "flex h-9 min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all",
          theme === "dark"
            ? "bg-card text-foreground shadow-sm"
            : "hover:text-foreground"
        )}
        title="Dark theme"
      >
        <Moon className="h-4 w-4 text-cyan-400" />
        <span className="hidden sm:inline">Dark</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "system"}
        onClick={() => setTheme("system")}
        className={cn(
          "flex h-9 min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all",
          theme === "system"
            ? "bg-card text-foreground shadow-sm"
            : "hover:text-foreground"
        )}
        title="System theme"
      >
        <Monitor className="h-4 w-4 text-emerald-500" />
        <span className="hidden sm:inline">System</span>
      </button>
    </div>
  );
}
