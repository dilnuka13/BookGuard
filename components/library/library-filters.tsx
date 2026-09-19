"use client";

import * as React from "react";
import type { LibraryFilters } from "@/types/library";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Filter, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LibraryFiltersProps {
  filters: LibraryFilters;
  onChange: (filters: LibraryFilters) => void;
  availableCategories: string[];
  availableLanguages: string[];
  className?: string;
}

export function LibraryFiltersBar({
  filters,
  onChange,
  availableCategories,
  availableLanguages,
  className,
}: LibraryFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Count active filter criteria
  const activeCount = [
    filters.category,
    filters.language,
    filters.author,
    filters.publishedYear,
  ].filter(Boolean).length;

  const handleClear = () => {
    onChange({
      ...filters,
      category: undefined,
      language: undefined,
      author: undefined,
      publishedYear: undefined,
    });
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant={activeCount > 0 ? "default" : "outline"}
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 min-h-[44px] gap-2 rounded-xl"
        aria-expanded={isOpen}
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </Button>

      {/* Filter Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-30 w-80 sm:w-96 rounded-2xl border border-border bg-card p-5 shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">Filter Library</h4>
            </div>

            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <Label className="text-[11px]">Category</Label>
            <select
              value={filters.category || ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  category: e.target.value || undefined,
                })
              }
              className="h-10 min-h-[40px] w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="space-y-1.5">
            <Label className="text-[11px]">Language</Label>
            <select
              value={filters.language || ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  language: e.target.value || undefined,
                })
              }
              className="h-10 min-h-[40px] w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Author Search Filter */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-author" className="text-[11px]">
              Author Name
            </Label>
            <Input
              id="filter-author"
              type="text"
              placeholder="e.g. Martin Wickramasinghe"
              value={filters.author || ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  author: e.target.value || undefined,
                })
              }
              className="h-10 min-h-[40px] text-xs"
            />
          </div>

          {/* Published Year Filter */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-year" className="text-[11px]">
              Published Year
            </Label>
            <Input
              id="filter-year"
              type="number"
              placeholder="e.g. 2024"
              min="1000"
              max="2100"
              value={filters.publishedYear ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  publishedYear: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className="h-10 min-h-[40px] text-xs"
            />
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="brandGradient"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
