"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Plus, RotateCcw, ArrowRight, ShoppingCart, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookComparison } from "./book-comparison";
import type { MatchCandidate } from "@/lib/matching/types";
import type { ScannedBookInput } from "@/lib/matching/match-book";

interface PossibleDuplicateResultProps {
  libraryBook: MatchCandidate;
  scannedBook: ScannedBookInput;
  onAddAnyway: () => void;
  onAddToCart?: () => void;
  onAddToWishlist?: () => void;
  onScanNext: () => void;
}

export function PossibleDuplicateResult({
  libraryBook,
  scannedBook,
  onAddAnyway,
  onAddToCart,
  onAddToWishlist,
  onScanNext,
}: PossibleDuplicateResultProps) {
  return (
    <div className="space-y-5 animate-scale-in">
      {/* Warning Status Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent p-5 text-center shadow-lg">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md mb-2.5">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          Possible Duplicate
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          You already own a similar book. Compare the two versions below to avoid an accidental repeat.
        </p>
      </div>

      {/* Side by Side Comparison Component */}
      <BookComparison libraryBook={libraryBook} scannedBook={scannedBook} />

      {/* Actions */}
      <div className="space-y-2.5 pt-2">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button asChild variant="outline" size="lg" className="flex-1 gap-2 rounded-xl">
            <Link href={`/library/${libraryBook.id}`}>
              <span>View Existing Copy</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button
            type="button"
            variant="brandGradient"
            size="lg"
            onClick={onAddAnyway}
            className="flex-1 gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Anyway</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {onAddToCart && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddToCart}
              className="flex-1 gap-2 text-primary border-primary/30 hover:bg-primary/10"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add to Cart</span>
            </Button>
          )}

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
