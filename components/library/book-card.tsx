"use client";

import * as React from "react";
import Link from "next/link";
import { BookCover } from "@/components/library/book-cover";
import { Badge } from "@/components/ui/badge";
import type { LibraryItem } from "@/types/library";
import { MoreVertical, Edit2, Trash2, Layers } from "lucide-react";

interface BookCardProps {
  book: LibraryItem;
  onDeleteRequest?: (book: LibraryItem) => void;
}

export function BookCard({ book, onDeleteRequest }: BookCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-3 sm:p-3.5 transition-all duration-200 hover:shadow-md hover:border-border/80">
      <Link
        href={`/library/${book.id}`}
        className="flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      >
        {/* Cover with Quantity Badge */}
        <div className="relative mx-auto w-full flex justify-center">
          <BookCover
            url={book.cover_url}
            title={book.title}
            author={book.author}
            size="lg"
            className="w-full max-w-[170px]"
          />

          {book.quantity > 1 && (
            <div className="absolute top-2 right-2 sm:right-4 flex items-center gap-1 rounded-full bg-slate-900/90 text-white px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur-sm border border-white/20">
              <Layers className="h-3 w-3" />
              <span>x{book.quantity}</span>
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="space-y-1 text-left min-h-[58px]">
          <h4 className="line-clamp-2 text-xs sm:text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
            {book.title}
          </h4>
          {book.author && (
            <p className="line-clamp-1 text-[11px] sm:text-xs text-muted-foreground font-medium">
              {book.author}
            </p>
          )}
        </div>
      </Link>

      {/* Footer Badges & Actions */}
      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[10px]">
        <div className="flex flex-wrap gap-1 items-center">
          <span className="font-mono text-[9px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
            {book.book_code}
          </span>
          {book.category && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              {book.category}
            </Badge>
          )}
        </div>

        {/* Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
            aria-label="Book actions menu"
            aria-expanded={menuOpen}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 bottom-full mb-1 z-20 w-32 rounded-xl border border-border bg-card p-1 shadow-lg backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-100"
            >
              <Link
                href={`/library/${book.id}/edit`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                role="menuitem"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Link>

              {onDeleteRequest && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteRequest(book);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  role="menuitem"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
