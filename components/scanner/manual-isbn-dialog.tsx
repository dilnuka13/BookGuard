"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { trackISBN, type ISBNTrackingAnalysis } from "@/lib/isbn/tracker";
import { checkOfflineIsbn } from "@/lib/offline/library-cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Barcode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Globe2,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Plus,
} from "lucide-react";
import type { OfflineLibraryItem } from "@/types/shopping";

interface ManualIsbnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitIsbn: (isbn: string) => void;
}

export function ManualIsbnDialog({
  open,
  onOpenChange,
  onSubmitIsbn,
}: ManualIsbnDialogProps) {
  const router = useRouter();
  const [inputVal, setInputVal] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [shelfItem, setShelfItem] = React.useState<OfflineLibraryItem | null>(null);
  const [isCheckingShelf, setIsCheckingShelf] = React.useState(false);

  const analysis: ISBNTrackingAnalysis | null = React.useMemo(() => {
    if (!inputVal.trim()) return null;
    return trackISBN(inputVal);
  }, [inputVal]);

  // Live shelf check when a valid ISBN is entered
  React.useEffect(() => {
    if (!analysis?.isValid || !analysis.normalized) {
      setShelfItem(null);
      return;
    }

    let active = true;
    setIsCheckingShelf(true);

    checkOfflineIsbn(analysis.normalized)
      .then((match) => {
        if (active) {
          setShelfItem(match);
          setIsCheckingShelf(false);
        }
      })
      .catch(() => {
        if (active) setIsCheckingShelf(false);
      });

    return () => {
      active = false;
    };
  }, [analysis?.isValid, analysis?.normalized]);

  const handleAddManually = () => {
    if (analysis?.isValid && analysis.normalized) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "bookguard_scan_prefill",
          JSON.stringify({ isbn: analysis.normalized })
        );
      }
      onOpenChange(false);
      router.push("/library/add?from_scan=1");
    }
  };

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleCopyAlternate = () => {
    const alt = analysis?.type === "ISBN-13" ? analysis.isbn10 : analysis?.isbn13;
    if (alt && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(alt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (analysis?.isValid && analysis.normalized) {
      onSubmitIsbn(analysis.normalized);
      onOpenChange(false);
      setInputVal("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl animate-scale-in text-card-foreground relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with high-tech badge */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Barcode className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                ISBN Tracker & Inspector
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Deconstruct, verify checksums, and check live library duplicate status.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="manualIsbn" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Enter or Paste ISBN / Barcode
            </Label>
            <div className="relative">
              <Input
                id="manualIsbn"
                type="text"
                placeholder="e.g. 978-955-652-123-4 or 9780140328721"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="font-mono text-base pr-11 tracking-wide h-12 rounded-2xl"
                autoFocus
              />
              {analysis && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {analysis.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Intelligence Breakdown Box ── */}
          {analysis && (
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 space-y-3 animate-fade-in text-xs">
              {/* Row 1: Country & Agency */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">
                    {analysis.group?.flag || "🌐"}
                  </span>
                  <div>
                    <span className="font-bold text-foreground">
                      {analysis.group?.name || (analysis.isSriLankan ? "Sri Lanka" : "International Bookland")}
                    </span>
                    {analysis.group?.code && (
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                        (Group {analysis.group.code})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                      analysis.isValid
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-destructive/15 text-destructive border border-destructive/30"
                    }`}
                  >
                    {analysis.isValid ? `Valid ${analysis.type}` : "Invalid Checksum"}
                  </span>
                </div>
              </div>

              {/* Row 2: Live Shelf Check Status (Duplicate Shield) */}
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Personal Collection Status
                  </span>
                  {isCheckingShelf && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>

                {shelfItem ? (
                  <div className="mt-2 flex items-center gap-2.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-xs leading-tight">
                        Already On Your Shelf! (Owned)
                      </p>
                      <p className="text-[11px] text-foreground font-medium truncate mt-0.5">
                        {shelfItem.title} {shelfItem.author ? `• ${shelfItem.author}` : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-semibold">
                      Safe to acquire! Not found in your cataloged collection.
                    </p>
                  </div>
                )}
              </div>

              {/* Row 3: Format conversion & segments */}
              <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] font-mono text-muted-foreground">
                <span>Formatted: {analysis.formatted}</span>
                {(analysis.isbn10 || analysis.isbn13) && (
                  <button
                    type="button"
                    onClick={handleCopyAlternate}
                    className="flex items-center gap-1 hover:text-foreground text-primary font-sans transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied!" : `Copy ${analysis.type === "ISBN-13" ? "ISBN-10" : "ISBN-13"}`}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!analysis?.isValid}
              onClick={handleAddManually}
              className="rounded-xl h-11 gap-1.5 font-medium border border-border"
            >
              <Plus className="h-4 w-4" />
              <span>Add Details Manually</span>
            </Button>
            <Button
              type="submit"
              variant="brandGradient"
              disabled={!analysis?.isValid}
              className="rounded-xl h-11 gap-2 font-semibold shadow-md"
            >
              <span>Scan & Track Book</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
