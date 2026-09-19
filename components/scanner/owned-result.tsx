"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, BookOpen, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatchCandidate } from "@/lib/matching/types";

interface OwnedResultProps {
  book: MatchCandidate;
  onScanNext: () => void;
}

export function OwnedResult({ book, onScanNext }: OwnedResultProps) {
  return (
    <div className="space-y-5 animate-scale-in">
      {/* Already Owned Status Banner */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent p-5 text-center shadow-lg">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md mb-2.5">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          Already Owned
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          This book is already safeguarded on your personal bookshelf.
        </p>
      </div>

      {/* Book Card Summary */}
      <div className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative aspect-[2/3] w-20 shrink-0 rounded-xl overflow-hidden bg-muted border border-border">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
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
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {book.book_code}
            </span>
            {book.quantity > 1 && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {book.quantity} copies
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
            {book.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-1">
            {book.author || "Unknown author"}
          </p>

          <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {book.edition && <span>{book.edition}</span>}
            {book.published_year && <span>&bull; {book.published_year}</span>}
            {book.isbn13 && <span className="font-mono">&bull; {book.isbn13}</span>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <Button asChild variant="brandGradient" size="lg" className="flex-1 gap-2">
          <Link href={`/library/${book.id}`}>
            <span>View My Copy</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onScanNext}
          className="flex-1 gap-2 rounded-xl"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Scan Next Book</span>
        </Button>
      </div>
    </div>
  );
}
