"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookCover } from "@/components/library/book-cover";
import { DeleteBookDialog } from "@/components/library/delete-book-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LibraryItem } from "@/types/library";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  Layers,
  Barcode,
  Coins,
  MapPin,
  FileText,
  Clock,
} from "lucide-react";

interface BookDetailsProps {
  book: LibraryItem;
}

export function BookDetails({ book }: BookDetailsProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const formattedAddedDate = new Date(book.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedPurchaseDate = book.purchase_date
    ? new Date(book.purchase_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/library">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <Link href={`/library/${book.id}/edit`}>
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="gap-1.5 text-destructive hover:bg-destructive/10 rounded-xl"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Book Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
          {/* Cover Display */}
          <div className="shrink-0">
            <BookCover
              url={book.cover_url}
              title={book.title}
              author={book.author}
              size="xl"
              priority
              className="shadow-md"
            />
          </div>

          {/* Book Information Header */}
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                {book.book_code}
              </span>
              {book.category && (
                <Badge variant="secondary">{book.category}</Badge>
              )}
              {book.language && (
                <Badge variant="outline">{book.language}</Badge>
              )}
              {book.quantity > 1 && (
                <Badge variant="emerald" className="gap-1">
                  <Layers className="h-3 w-3" />
                  <span>{book.quantity} Copies Owned</span>
                </Badge>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                {book.title}
              </h1>
              {book.author && (
                <p className="mt-1 text-base sm:text-lg font-medium text-muted-foreground">
                  by <span className="text-foreground">{book.author}</span>
                </p>
              )}
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              {book.published_year && (
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <span className="text-muted-foreground flex items-center gap-1 mb-0.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>Published</span>
                  </span>
                  <p className="font-semibold text-foreground">{book.published_year}</p>
                </div>
              )}

              {book.publisher && (
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <span className="text-muted-foreground flex items-center gap-1 mb-0.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span>Publisher</span>
                  </span>
                  <p className="font-semibold text-foreground truncate">{book.publisher}</p>
                </div>
              )}

              {book.edition && (
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <span className="text-muted-foreground flex items-center gap-1 mb-0.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>Edition</span>
                  </span>
                  <p className="font-semibold text-foreground truncate">{book.edition}</p>
                </div>
              )}

              {book.isbn13 && (
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5 col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground flex items-center gap-1 mb-0.5">
                    <Barcode className="h-3.5 w-3.5 text-primary" />
                    <span>ISBN-13</span>
                  </span>
                  <p className="font-mono font-semibold text-foreground">{book.isbn13}</p>
                </div>
              )}

              {book.isbn10 && (
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <span className="text-muted-foreground flex items-center gap-1 mb-0.5">
                    <Barcode className="h-3.5 w-3.5 text-primary" />
                    <span>ISBN-10</span>
                  </span>
                  <p className="font-mono font-semibold text-foreground">{book.isbn10}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details Sections */}
      {(book.purchase_price !== null || book.purchase_date || book.purchase_place) && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
            Purchase History
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {book.purchase_price !== null && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Price Paid</span>
                  <span className="font-semibold text-foreground">
                    LKR {Number(book.purchase_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {formattedPurchaseDate && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Purchase Date</span>
                  <span className="font-semibold text-foreground">{formattedPurchaseDate}</span>
                </div>
              </div>
            )}

            {book.purchase_place && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Store / Location</span>
                  <span className="font-semibold text-foreground">{book.purchase_place}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Section */}
      {book.notes && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <FileText className="h-4 w-4" />
            <span>Personal Notes</span>
          </div>
          <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
            {book.notes}
          </p>
        </div>
      )}

      {/* Record Footer Metadata */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground px-2">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Added to library on {formattedAddedDate}</span>
        </div>
        <span>UUID: <span className="font-mono text-[10px]">{book.id}</span></span>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteBookDialog
        book={book}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={() => {
          router.push("/library");
          router.refresh();
        }}
      />
    </div>
  );
}
