"use client";

import * as React from "react";
import { HelpCircle, RotateCcw, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OwnedResult } from "./owned-result";
import { PossibleDuplicateResult } from "./possible-duplicate-result";
import { NewBookResult } from "./new-book-result";
import type { MatchResult } from "@/lib/matching/types";

interface ScanResultViewProps {
  matchResult: MatchResult;
  onScanNext: () => void;
  onAddToLibrary: () => void;
  onOpenManualIsbn: () => void;
  onAddToCart?: () => void;
  onAddToWishlist?: () => void;
}

export function ScanResultView({
  matchResult,
  onScanNext,
  onAddToLibrary,
  onOpenManualIsbn,
  onAddToCart,
  onAddToWishlist,
}: ScanResultViewProps) {
  if (matchResult.result === "OWNED" && matchResult.matchedBook) {
    return <OwnedResult book={matchResult.matchedBook} onScanNext={onScanNext} />;
  }

  if (matchResult.result === "POSSIBLE_DUPLICATE" && matchResult.matchedBook) {
    return (
      <PossibleDuplicateResult
        libraryBook={matchResult.matchedBook}
        scannedBook={matchResult.scannedData}
        onAddAnyway={onAddToLibrary}
        onAddToCart={onAddToCart}
        onAddToWishlist={onAddToWishlist}
        onScanNext={onScanNext}
      />
    );
  }

  if (matchResult.result === "NEW") {
    return (
      <NewBookResult
        scannedBook={matchResult.scannedData}
        onAddToLibrary={onAddToLibrary}
        onAddToCart={onAddToCart}
        onAddToWishlist={onAddToWishlist}
        onScanNext={onScanNext}
      />
    );
  }

  // UNKNOWN / Inconclusive Fallback State
  return (
    <div className="space-y-5 text-center p-6 rounded-3xl border border-border bg-card shadow-lg animate-scale-in">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-2">
        <HelpCircle className="h-7 w-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">Scan Inconclusive</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
          {matchResult.evidence.reasons[0] ||
            "Unable to recognize the book barcode or cover text clearly. Please try again with better lighting or enter the ISBN manually."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <Button
          type="button"
          variant="brandGradient"
          size="lg"
          onClick={onScanNext}
          className="flex-1 gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onOpenManualIsbn}
          className="flex-1 gap-2 rounded-xl"
        >
          <Keyboard className="h-4 w-4" />
          <span>Enter ISBN</span>
        </Button>
      </div>
    </div>
  );
}
