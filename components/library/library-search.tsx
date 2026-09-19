"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LibrarySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LibrarySearch({
  value,
  onChange,
  placeholder = "Search by title, author, ISBN, or code...",
  className,
}: LibrarySearchProps) {
  const [internalVal, setInternalVal] = React.useState(value);

  // Synchronize internal state with external value changes
  React.useEffect(() => {
    setInternalVal(value);
  }, [value]);

  // Debounce notification to parent
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (internalVal !== value) {
        onChange(internalVal);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [internalVal, value, onChange]);

  const handleClear = () => {
    setInternalVal("");
    onChange("");
  };

  return (
    <div className={cn("relative flex-1 min-w-[200px]", className)}>
      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>

      <input
        type="search"
        value={internalVal}
        onChange={(e) => setInternalVal(e.target.value)}
        placeholder={placeholder}
        className="h-11 min-h-[44px] w-full rounded-xl border border-input bg-card pl-10 pr-9 text-xs sm:text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />

      {internalVal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Clear search query"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
