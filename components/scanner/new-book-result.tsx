"use client";

import * as React from "react";
import Image from "next/image";
import { Sparkles, Plus, RotateCcw, BookOpen, ShoppingCart, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScannedBookInput } from "@/lib/matching/match-book";

interface NewBookResultProps {
  scannedBook: ScannedBookInput;
  onAddToLibrary: () => void;
  onAddToCart?: () => void;
  onAddToWishlist?: () => void;
  onScanNext: () => void;
}

export function NewBookResult({
  scannedBook,
  onAddToLibrary,
  onAddToCart,
  onAddToWishlist,
  onScanNext,
}: NewBookResultProps) {
  return (
    <div className="space-y-5 animate-scale-in">
      {/* New Book Status Banner */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent p-5 text-center shadow-lg">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md mb-2.5">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          Not in Your Library
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Clear to purchase! This title is not in your personal catalog.
        </p>
      </div>

      {/* Book Metadata Card */}
      <div className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative aspect-[2/3] w-20 shrink-0 rounded-xl overflow-hidden bg-muted border border-border">
          {scannedBook.coverUrl ? (
            <Image
              src={scannedBook.coverUrl}
              alt={scannedBook.title || "Detected cover"}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
              <BookOpen className="h-6 w-6 opacity-40" />
            </div>
          )}
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            New Title
          </span>

          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
            {scannedBook.title || "New Book (Uncataloged)"}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-1">
            {scannedBook.author || "Enter book details manually to add to shelf"}
          </p>

          <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {scannedBook.edition && <span>{scannedBook.edition}</span>}
            {scannedBook.publishedYear && <span>&bull; {scannedBook.publishedYear}</span>}
            {scannedBook.isbn && <span className="font-mono font-medium text-foreground">&bull; ISBN: {scannedBook.isbn}</span>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            type="button"
            variant="brandGradient"
            size="lg"
            onClick={onAddToLibrary}
            className="flex-1 gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Details Manually</span>
          </Button>

          {onAddToCart && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onAddToCart}
              className="flex-1 gap-2 rounded-xl border-primary/40 text-primary hover:bg-primary/10"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add to Cart</span>
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {onAddToWishlist && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onAddToWishlist}
              className="flex-1 gap-2 text-muted-foreground hover:text-foreground"
            >
              <Bookmark className="h-4 w-4" />
              <span>Save to Wishlist</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onScanNext}
            className="flex-1 gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Scan Next Book</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
