"use client";

import * as React from "react";
import Link from "next/link";
import { BookCover } from "@/components/library/book-cover";
import { Badge } from "@/components/ui/badge";
import type { LibraryItem } from "@/types/library";
import { Edit2, Trash2, Layers } from "lucide-react";

interface BookListItemProps {
  book: LibraryItem;
  onDeleteRequest?: (book: LibraryItem) => void;
}

export function BookListItem({ book, onDeleteRequest }: BookListItemProps) {
  return (
    <div className="group flex items-center justify-between gap-3.5 rounded-2xl border border-border bg-card p-3 sm:p-4 transition-all hover:border-border/80 hover:shadow-sm">
      <Link
        href={`/library/${book.id}`}
        className="flex items-center gap-3.5 flex-1 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      >
        <BookCover
          url={book.cover_url}
          title={book.title}
          author={book.author}
          size="sm"
          className="h-16 w-11 shrink-0"
        />

        <div className="flex-1 min-w-0 space-y-1 text-left">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {book.title}
            </h4>
            {book.quantity > 1 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
                <Layers className="h-2.5 w-2.5" />
                x{book.quantity}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {book.author && <span className="truncate">{book.author}</span>}
            {book.published_year && (
              <>
                <span>&bull;</span>
                <span>{book.published_year}</span>
              </>
            )}
            {book.category && (
              <>
                <span className="hidden sm:inline">&bull;</span>
                <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                  {book.category}
                </Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
            <span>{book.book_code}</span>
            {book.isbn13 && <span>&bull; ISBN {book.isbn13}</span>}
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/library/${book.id}/edit`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
          title="Edit book"
          aria-label="Edit book"
        >
          <Edit2 className="h-4 w-4" />
        </Link>

        {onDeleteRequest && (
          <button
            type="button"
            onClick={() => onDeleteRequest(book)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus:outline-none"
            title="Delete book"
            aria-label="Delete book"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
