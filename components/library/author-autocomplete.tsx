"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { triggerHaptic } from "@/lib/utils/haptics";
import { getCachedLibraryItems } from "@/lib/offline/db";
import type { AuthorSuggestion } from "@/lib/books/authors";
import {
  User,
  Check,
  Sparkles,
  BookOpen,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface AuthorAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function AuthorAutocomplete({
  id = "book-author",
  value,
  onChange,
  onSelect,
  placeholder = "e.g. Martin Wickramasinghe or මාර්ටින් වික්‍රමසිංහ",
  disabled = false,
  className,
  error = false,
}: AuthorAutocompleteProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLUListElement>(null);

  const [suggestions, setSuggestions] = React.useState<AuthorSuggestion[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

  // In-memory query cache for instant 0ms responses
  const cacheRef = React.useRef<Map<string, AuthorSuggestion[]>>(new Map());

  // Fetch suggestions with debouncing and offline support
  const fetchSuggestions = React.useCallback(async (query: string) => {
    const trimmed = query.trim();

    // Check memory cache
    const cacheKey = trimmed.toLowerCase();
    if (cacheRef.current.has(cacheKey)) {
      setSuggestions(cacheRef.current.get(cacheKey) || []);
      return;
    }

    setIsLoading(true);

    try {
      // 1. If offline, search local IndexedDB library items
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cachedBooks = await getCachedLibraryItems();
        const authorMap = new Map<string, number>();

        for (const b of cachedBooks) {
          if (b.author && b.author.trim()) {
            const a = b.author.trim();
            if (!trimmed || a.toLowerCase().includes(trimmed.toLowerCase())) {
              authorMap.set(a, (authorMap.get(a) || 0) + 1);
            }
          }
        }

        const offlineList: AuthorSuggestion[] = Array.from(authorMap.entries()).map(
          ([name, count]) => ({
            name,
            bookCount: count,
            source: "library",
          })
        );

        cacheRef.current.set(cacheKey, offlineList);
        setSuggestions(offlineList);
        setIsLoading(false);
        return;
      }

      // 2. Fetch from API endpoint
      const res = await fetch(
        `/api/authors/suggest?q=${encodeURIComponent(trimmed)}&limit=12`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.authors)) {
          cacheRef.current.set(cacheKey, data.authors);
          setSuggestions(data.authors);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch author suggestions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search on input change
  React.useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchSuggestions(value);
    }, 120);

    return () => clearTimeout(timer);
  }, [value, isOpen, fetchSuggestions]);

  // Click outside listener
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle selecting an author suggestion
  const handleSelectAuthor = (authorName: string) => {
    onChange(authorName);
    onSelect?.(authorName);
    setIsOpen(false);
    setHighlightedIndex(-1);
    triggerHaptic("light");
  };

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      fetchSuggestions(value);
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectAuthor(suggestions[highlightedIndex].name);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Highlight matched substring
  const renderHighlightedName = (name: string, query: string) => {
    if (!query.trim()) return name;
    const cleanQ = query.trim().toLowerCase();
    const lowerName = name.toLowerCase();
    const idx = lowerName.indexOf(cleanQ);

    if (idx === -1) return name;

    const before = name.slice(0, idx);
    const match = name.slice(idx, idx + cleanQ.length);
    const after = name.slice(idx + cleanQ.length);

    return (
      <>
        {before}
        <span className="font-semibold text-primary underline decoration-primary/40 underline-offset-2">
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          error={error}
          autoComplete="off"
          className={`pr-16 transition-all duration-200 ${className || ""}`}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            fetchSuggestions(value);
          }}
          onKeyDown={handleKeyDown}
        />

        {/* Right Action Icons: Spinner / Clear / Suggestion Indicator */}
        <div className="absolute right-2.5 flex items-center gap-1 text-muted-foreground pointer-events-auto">
          {isLoading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/70" />
          )}

          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(true);
                fetchSuggestions("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full hover:bg-muted hover:text-foreground transition-colors"
              title="Clear author name"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
              } else {
                setIsOpen(true);
                fetchSuggestions(value);
                inputRef.current?.focus();
              }
            }}
            className="p-1 rounded-full hover:bg-muted hover:text-foreground transition-colors"
            title="Browse author suggestions"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in-50 zoom-in-95">
          <div className="p-1.5">
            {/* Header info / tip */}
            <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-medium text-muted-foreground border-b border-border/50 mb-1">
              <span className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-primary" />
                <span>Author Suggestions</span>
              </span>
              <span className="text-[10px] text-muted-foreground/80">
                {suggestions.length} available
              </span>
            </div>

            {/* Suggestions list */}
            {suggestions.length > 0 ? (
              <ul
                ref={dropdownRef}
                className="max-h-60 overflow-y-auto overflow-x-hidden space-y-0.5 py-0.5 text-sm focus:outline-none"
              >
                {suggestions.map((item, index) => {
                  const isHighlighted = highlightedIndex === index;
                  const isExactSelected =
                    value.trim().toLowerCase() === item.name.toLowerCase();

                  return (
                    <li
                      key={`${item.name}-${index}`}
                      onClick={() => handleSelectAuthor(item.name)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer select-none transition-colors duration-150 ${
                        isHighlighted
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted/70 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                            isHighlighted
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {item.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate">
                          {isHighlighted
                            ? item.name
                            : renderHighlightedName(item.name, value)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.bookCount && item.bookCount > 0 ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                              isHighlighted
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            <BookOpen className="h-2.5 w-2.5" />
                            <span>
                              {item.bookCount} {item.bookCount === 1 ? "book" : "books"}
                            </span>
                          </span>
                        ) : item.source === "community" ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              isHighlighted
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            Community
                          </span>
                        ) : null}

                        {isExactSelected && (
                          <Check
                            className={`h-4 w-4 ${
                              isHighlighted
                                ? "text-primary-foreground"
                                : "text-emerald-500"
                            }`}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : !isLoading ? (
              <div className="py-4 px-3 text-center">
                <p className="text-xs text-muted-foreground">
                  No previous matching author found for &quot;{value.trim()}&quot;.
                </p>
                {value.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      triggerHaptic("light");
                    }}
                    className="mt-2 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>Keep &quot;{value.trim()}&quot; as new author</span>
                  </button>
                )}
              </div>
            ) : null}

            {/* Footer tip */}
            <div className="px-3 py-1.5 mt-1 border-t border-border/50 text-[10px] text-muted-foreground/75 flex items-center justify-between">
              <span>Use ↑ ↓ to navigate, Enter to select</span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                <span>Syncs to catalog</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
