"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { deleteBookCover } from "@/lib/storage/book-cover";
import type { LibraryItem } from "@/types/library";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteBookDialogProps {
  book: LibraryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (bookId: string) => void;
}

export function DeleteBookDialog({
  book,
  isOpen,
  onClose,
  onDeleted,
}: DeleteBookDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen || !book) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      const supabase = createClient();

      // 1. If book has a cover in storage, clean it up
      if (book.cover_storage_path) {
        await deleteBookCover(supabase, book.cover_storage_path);
      }

      // 2. Delete the record from library_items
      const { error: deleteError } = await supabase
        .from("library_items")
        .delete()
        .eq("id", book.id);

      if (deleteError) {
        throw new Error(`Failed to remove book: ${deleteError.message}`);
      }

      onDeleted(book.id);
      onClose();
    } catch (err) {
      console.error("Delete book error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while deleting the book."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <h3
              id="delete-dialog-title"
              className="text-base sm:text-lg font-bold text-foreground leading-tight"
            >
              Remove &ldquo;{book.title}&rdquo;?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              This will permanently delete this book and its uploaded cover from your personal library. This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <span>Remove Book</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
