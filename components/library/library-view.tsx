"use client";

import * as React from "react";
import Link from "next/link";
import { BookCard } from "@/components/library/book-card";
import { BookListItem } from "@/components/library/book-list-item";
import { LibrarySearch } from "@/components/library/library-search";
import { LibraryFiltersBar } from "@/components/library/library-filters";
import { LibrarySort } from "@/components/library/library-sort";
import { LibraryViewToggle } from "@/components/library/library-view-toggle";
import { DeleteBookDialog } from "@/components/library/delete-book-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getLibraryItems } from "@/lib/books/queries";
import type {
  LibraryItem,
  LibraryFilters,
  LibrarySortOption,
  LibraryViewMode,
} from "@/types/library";
import {
  Plus,
  BookOpen,
  SearchX,
  Loader2,
  LibraryBig,
} from "lucide-react";

interface LibraryViewProps {
  initialItems: LibraryItem[];
  initialTotalCount: number;
  availableCategories: string[];
  availableLanguages: string[];
  userId: string;
}

const STORAGE_VIEW_KEY = "bookguard_library_view_mode";

export function LibraryView({
  initialItems,
  initialTotalCount,
  availableCategories,
  availableLanguages,
  userId,
}: LibraryViewProps) {
  const [items, setItems] = React.useState<LibraryItem[]>(initialItems);
  const [totalCount, setTotalCount] = React.useState(initialTotalCount);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<LibraryFilters>({});
  const [sort, setSort] = React.useState<LibrarySortOption>("recent");
  const [viewMode, setViewMode] = React.useState<LibraryViewMode>("grid");
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(initialTotalCount > initialItems.length);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<LibraryItem | null>(null);

  // Restore view mode from localStorage on client mount
  React.useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_VIEW_KEY) as LibraryViewMode | null;
      if (savedMode === "grid" || savedMode === "list") {
        setViewMode(savedMode);
      }
    } catch {
      // Ignored if localStorage unavailable
    }
  }, []);

  const handleViewModeChange = (mode: LibraryViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(STORAGE_VIEW_KEY, mode);
    } catch {
      // Ignored
    }
  };

  // Re-fetch books when search, filters, or sort change
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    async function fetchFilteredItems() {
      try {
        setIsLoading(true);
        const supabase = createClient();
        const result = await getLibraryItems(supabase, {
          userId,
          filters: { ...filters, search },
          sort,
          page: 1,
          pageSize: 24,
        });

        setItems(result.items);
        setTotalCount(result.totalCount);
        setHasMore(result.hasMore);
        setPage(1);
      } catch (err) {
        console.error("Filter fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFilteredItems();
  }, [search, filters, sort, userId]);

  // Load more pagination handler
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const supabase = createClient();
      const result = await getLibraryItems(supabase, {
        userId,
        filters: { ...filters, search },
        sort,
        page: nextPage,
        pageSize: 24,
      });

      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle book deleted from state
  const handleBookDeleted = (deletedId: string) => {
    setItems((prev) => prev.filter((b) => b.id !== deletedId));
    setTotalCount((prev) => Math.max(0, prev - 1));
  };

  const hasActiveCriteria = Boolean(
    search.trim() ||
    filters.category ||
    filters.language ||
    filters.author ||
    filters.publishedYear
  );

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search, Filters, Sort, View Toggle, Add CTAs */}
      <div className="flex flex-col gap-3">
        {/* Top row: Search input + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <LibrarySearch
            value={search}
            onChange={setSearch}
            className="flex-1"
          />

          <div className="flex items-center gap-2">
            <Button asChild variant="brandGradient" className="h-11 rounded-xl gap-2 min-h-[44px]">
              <Link href="/library/add">
                <Plus className="h-4 w-4" />
                <span>Add Book</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-11 rounded-xl hidden sm:inline-flex min-h-[44px]">
              <Link href="/library/bulk-add">Bulk Add</Link>
            </Button>
          </div>
        </div>

        {/* Second row: Filter, Sort, View Toggle, Total count */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-2">
            <LibraryFiltersBar
              filters={filters}
              onChange={setFilters}
              availableCategories={availableCategories}
              availableLanguages={availableLanguages}
            />

            <LibrarySort sort={sort} onChange={setSort} />

            <span className="hidden sm:inline-block text-xs text-muted-foreground pl-2 font-medium">
              {totalCount} {totalCount === 1 ? "book" : "books"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="sm:hidden text-xs text-primary">
              <Link href="/library/bulk-add">+ Bulk</Link>
            </Button>
            <LibraryViewToggle mode={viewMode} onChange={handleViewModeChange} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Searching your library...</p>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        hasActiveCriteria ? (
          <EmptyState
            icon={SearchX}
            title="No Matching Books Found"
            description="We couldn't find any books matching your search or filters. Try adjusting your terms or resetting filters."
            actionLabel="Clear Search & Filters"
            onAction={() => {
              setSearch("");
              setFilters({});
            }}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-8 sm:p-14 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <BookOpen className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                Your shelf is waiting.
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Add the books you already own so BookGuard can help prevent duplicate purchases later.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button asChild variant="brandGradient" size="lg" className="w-full sm:w-auto">
                <Link href="/library/add" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Your First Book</span>
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/library/bulk-add">Bulk Add Books</Link>
              </Button>
            </div>
          </div>
        )
      ) : (
        /* Book Collection Render (Grid or List) */
        <div className="space-y-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {items.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDeleteRequest={setDeleteTarget}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((book) => (
                <BookListItem
                  key={book.id}
                  book={book}
                  onDeleteRequest={setDeleteTarget}
                />
              ))}
            </div>
          )}

          {/* Load More Pagination */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="min-w-[160px] rounded-2xl"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading More...</span>
                  </>
                ) : (
                  <span>Load More Books</span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteBookDialog
        book={deleteTarget}
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleBookDeleted}
      />
    </div>
  );
}
