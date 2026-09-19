"use client";

import * as React from "react";
import type { LibrarySortOption } from "@/types/library";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LibrarySortProps {
  sort: LibrarySortOption;
  onChange: (sort: LibrarySortOption) => void;
  className?: string;
}

const SORT_OPTIONS: { value: LibrarySortOption; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "oldest", label: "Oldest Added" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "author-asc", label: "Author A–Z" },
  { value: "year-desc", label: "Published Year Newest" },
  { value: "year-asc", label: "Published Year Oldest" },
];

export function LibrarySort({ sort, onChange, className }: LibrarySortProps) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <label htmlFor="library-sort-select" className="sr-only">
        Sort library items
      </label>
      <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
        <ArrowUpDown className="h-4 w-4" />
      </div>

      <select
        id="library-sort-select"
        value={sort}
        onChange={(e) => onChange(e.target.value as LibrarySortOption)}
        className="h-11 min-h-[44px] appearance-none rounded-xl border border-border bg-card pl-9 pr-8 text-xs sm:text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute right-2.5 flex items-center text-muted-foreground">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
