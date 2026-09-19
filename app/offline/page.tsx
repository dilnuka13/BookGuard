"use client";

import * as React from "react";
import Link from "next/link";
import {
  WifiOff,
  Search,
  ScanLine,
  BookOpen,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findCachedBookByISBN, findCachedBookByTitle, getSyncMeta } from "@/lib/offline/db";
import type { OfflineLibraryItem } from "@/types/shopping";
import { BookGuardLogo } from "@/components/branding/bookguard-logo";

export default function OfflinePage() {
  const [query, setQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [match, setMatch] = React.useState<OfflineLibraryItem | null>(null);
  const [cachedCount, setCachedCount] = React.useState<number>(0);

  React.useEffect(() => {
    getSyncMeta().then((meta) => {
      setCachedCount(meta.count);
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setIsSearching(true);
    setSearched(true);
    try {
      // 1. Check by ISBN first
      let res = await findCachedBookByISBN(clean);
      // 2. If not found by ISBN, check title
      if (!res) {
        res = await findCachedBookByTitle(clean);
      }
      setMatch(res);
    } catch {
      setMatch(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between max-w-xl w-full mx-auto pb-4">
        <BookGuardLogo variant="horizontal" href="/" />
      </header>

      <main className="max-w-md w-full mx-auto my-auto space-y-6 text-center animate-scale-in">
        {/* Offline Status Icon */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-md">
          <WifiOff className="h-8 w-8" />
        </div>

        {/* Header Content */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            You&apos;re Offline
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your cached library can still help you check books you&apos;ve already saved ({cachedCount} {cachedCount === 1 ? "book" : "books"} on shelf).
          </p>
        </div>

        {/* Offline Quick Search Card */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-lg text-left space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            <span>Offline Shelf Duplicate Check</span>
          </h2>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter ISBN or book title..."
              className="h-10 text-sm rounded-xl"
            />
            <Button
              type="submit"
              variant="brandGradient"
              disabled={isSearching}
              className="h-10 px-4 rounded-xl shrink-0"
            >
              Check
            </Button>
          </form>

          {searched && (
            <div className="pt-2">
              {match ? (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-start gap-3 animate-fade-in">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      Already on your shelf
                    </span>
                    <h4 className="text-sm font-bold text-foreground truncate">{match.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{match.author || "Unknown author"}</p>
                    <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-muted-foreground">
                      <span>Code: {match.book_code}</span>
                      {match.isbn13 && <span>&bull; {match.isbn13}</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-muted/50 border border-border p-3.5 flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Not found in your cached library.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button asChild variant="brandGradient" size="lg" className="flex-1 gap-2 rounded-2xl h-12">
            <Link href="/scan">
              <ScanLine className="h-4 w-4" />
              <span>Camera Scanner</span>
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => window.location.reload()}
            className="flex-1 gap-2 rounded-2xl h-12"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retry Connection</span>
          </Button>
        </div>

        {/* Notice */}
        <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">
          Online book details and cloud catalog updates will automatically resume when your connection is restored.
        </p>
      </main>

      <footer className="max-w-xl w-full mx-auto pt-4 text-center text-xs text-muted-foreground/60">
        BookGuard Offline Shell &bull; Phase 05 PWA
      </footer>
    </div>
  );
}
