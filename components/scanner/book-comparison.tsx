"use client";

import * as React from "react";
import Image from "next/image";
import { BookOpen, AlertTriangle } from "lucide-react";
import type { MatchCandidate } from "@/lib/matching/types";
import type { ScannedBookInput } from "@/lib/matching/match-book";

interface BookComparisonProps {
  libraryBook: MatchCandidate;
  scannedBook: ScannedBookInput;
}

export function BookComparison({ libraryBook, scannedBook }: BookComparisonProps) {
  const isDifferentEdition =
    libraryBook.edition?.toLowerCase().trim() !==
    scannedBook.edition?.toLowerCase().trim();

  const isDifferentYear =
    Boolean(libraryBook.published_year) &&
    Boolean(scannedBook.publishedYear) &&
    libraryBook.published_year !== scannedBook.publishedYear;

  const isDifferentIsbn =
    Boolean(scannedBook.isbn) &&
    libraryBook.isbn13 !== scannedBook.isbn &&
    libraryBook.isbn10 !== scannedBook.isbn;

  return (
    <div className="space-y-3">
      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border">
        {/* Left Column: Your Library Copy */}
        <div className="space-y-2 border-r border-border/60 pr-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <BookOpen className="h-3 w-3" />
            <span>Your Copy</span>
          </div>

          <div className="relative aspect-[2/3] w-full max-w-[90px] mx-auto rounded-lg overflow-hidden bg-muted border border-border shadow-sm">
            {libraryBook.cover_url ? (
              <Image
                src={libraryBook.cover_url}
                alt={libraryBook.title}
                fill
                sizes="90px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
                <BookOpen className="h-6 w-6 opacity-40" />
              </div>
            )}
          </div>

          <div className="text-left space-y-0.5">
            <p className="text-xs font-bold text-foreground line-clamp-2">{libraryBook.title}</p>
            <p className="text-[11px] text-muted-foreground line-clamp-1">{libraryBook.author || "Unknown author"}</p>
          </div>

          <div className="text-[11px] space-y-1 pt-1 border-t border-border/40 text-left">
            <div>
              <span className="text-muted-foreground text-[10px]">Edition:</span>{" "}
              <span className="font-semibold text-foreground">{libraryBook.edition || "Standard"}</span>
            </div>
            {libraryBook.published_year && (
              <div>
                <span className="text-muted-foreground text-[10px]">Year:</span>{" "}
                <span className="font-semibold text-foreground">{libraryBook.published_year}</span>
              </div>
            )}
            {libraryBook.isbn13 && (
              <div>
                <span className="text-muted-foreground text-[10px]">ISBN:</span>{" "}
                <span className="font-mono text-[10px] text-foreground">{libraryBook.isbn13}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scanned Book */}
        <div className="space-y-2 pl-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span>Scanned Book</span>
          </div>

          <div className="relative aspect-[2/3] w-full max-w-[90px] mx-auto rounded-lg overflow-hidden bg-muted border border-border shadow-sm">
            {scannedBook.coverUrl ? (
              <Image
                src={scannedBook.coverUrl}
                alt={scannedBook.title || "Scanned cover"}
                fill
                sizes="90px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
                <BookOpen className="h-6 w-6 opacity-40" />
              </div>
            )}
          </div>

          <div className="text-left space-y-0.5">
            <p className="text-xs font-bold text-foreground line-clamp-2">
              {scannedBook.title || "Scanned title"}
            </p>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              {scannedBook.author || "Unknown author"}
            </p>
          </div>

          <div className="text-[11px] space-y-1 pt-1 border-t border-border/40 text-left">
            <div>
              <span className="text-muted-foreground text-[10px]">Edition:</span>{" "}
              <span
                className={`font-semibold ${
                  isDifferentEdition && scannedBook.edition
                    ? "text-amber-600 dark:text-amber-400 font-bold underline"
                    : "text-foreground"
                }`}
              >
                {scannedBook.edition || "Standard"}
              </span>
            </div>
            {scannedBook.publishedYear && (
              <div>
                <span className="text-muted-foreground text-[10px]">Year:</span>{" "}
                <span
                  className={`font-semibold ${
                    isDifferentYear
                      ? "text-amber-600 dark:text-amber-400 font-bold underline"
                      : "text-foreground"
                  }`}
                >
                  {scannedBook.publishedYear}
                </span>
              </div>
            )}
            {scannedBook.isbn && (
              <div>
                <span className="text-muted-foreground text-[10px]">ISBN:</span>{" "}
                <span
                  className={`font-mono text-[10px] ${
                    isDifferentIsbn
                      ? "text-amber-600 dark:text-amber-400 font-bold"
                      : "text-foreground"
                  }`}
                >
                  {scannedBook.isbn}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
