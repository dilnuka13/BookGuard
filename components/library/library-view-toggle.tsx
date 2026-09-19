"use client";

import * as React from "react";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { LibraryViewMode } from "@/types/library";

interface LibraryViewToggleProps {
  mode: LibraryViewMode;
  onChange: (mode: LibraryViewMode) => void;
  className?: string;
}

export function LibraryViewToggle({
  mode,
  onChange,
  className,
}: LibraryViewToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Library view mode"
      className={cn(
        "inline-flex h-11 items-center rounded-xl border border-border bg-muted/50 p-1 text-muted-foreground",
        className
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "grid"}
        onClick={() => onChange("grid")}
        className={cn(
          "flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg transition-all",
          mode === "grid"
            ? "bg-card text-foreground shadow-sm"
            : "hover:text-foreground"
        )}
        title="Grid view"
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={mode === "list"}
        onClick={() => onChange("list")}
        className={cn(
          "flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg transition-all",
          mode === "list"
            ? "bg-card text-foreground shadow-sm"
            : "hover:text-foreground"
        )}
        title="List view"
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
