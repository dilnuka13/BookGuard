"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteScanHistoryEntry, clearAllScanHistory, type ScanHistoryRow } from "@/lib/scanner/history";
import {
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Trash2,
  Clock,
  ScanLine,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanHistoryListProps {
  initialScans: ScanHistoryRow[];
  userId: string;
}

export function ScanHistoryList({ initialScans, userId }: ScanHistoryListProps) {
  const router = useRouter();
  const [scans, setScans] = React.useState<ScanHistoryRow[]>(initialScans);
  const [activeFilter, setActiveFilter] = React.useState<"ALL" | "OWNED" | "POSSIBLE_DUPLICATE" | "NEW">("ALL");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const filteredScans = React.useMemo(() => {
    if (activeFilter === "ALL") return scans;
    return scans.filter((s) => s.match_type === activeFilter);
  }, [scans, activeFilter]);

  const handleDelete = async (scanId: string) => {
    const supabase = createClient();
    setScans((prev) => prev.filter((s) => s.id !== scanId));
    await deleteScanHistoryEntry(supabase, userId, scanId);
    router.refresh();
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear your entire scan history? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    try {
      const supabase = createClient();
      await clearAllScanHistory(supabase, userId);
      setScans([]);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  if (scans.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
          <ScanLine className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Scan Records</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
          You haven&apos;t scanned any books yet. Whenever you use the Smart Scanner, your checks will be recorded here.
        </p>
        <Button asChild variant="brandGradient" size="sm" className="mt-5 gap-2">
          <Link href="/scan">
            <span>Open Smart Scanner</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter and Clear Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <Button
            type="button"
            variant={activeFilter === "ALL" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("ALL")}
            className="rounded-full text-xs h-8"
          >
            All ({scans.length})
          </Button>

          <Button
            type="button"
            variant={activeFilter === "OWNED" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("OWNED")}
            className="rounded-full text-xs h-8"
          >
            Already Owned ({scans.filter((s) => s.match_type === "OWNED").length})
          </Button>

          <Button
            type="button"
            variant={activeFilter === "POSSIBLE_DUPLICATE" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("POSSIBLE_DUPLICATE")}
            className="rounded-full text-xs h-8"
          >
            Duplicates ({scans.filter((s) => s.match_type === "POSSIBLE_DUPLICATE").length})
          </Button>

          <Button
            type="button"
            variant={activeFilter === "NEW" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("NEW")}
            className="rounded-full text-xs h-8"
          >
            New Books ({scans.filter((s) => s.match_type === "NEW").length})
          </Button>
        </div>

        {/* Clear All Action */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDeleting}
          onClick={handleClearAll}
          className="text-xs text-muted-foreground hover:text-destructive gap-1.5 h-8"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear History</span>
        </Button>
      </div>

      {/* Scans List */}
      <div className="space-y-3">
        {filteredScans.map((scan) => {
          const isOwned = scan.match_type === "OWNED";
          const isDuplicate = scan.match_type === "POSSIBLE_DUPLICATE";
          const isNew = scan.match_type === "NEW";

          const formattedDate = new Date(scan.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={scan.id}
              className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5 ${
                    isOwned
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : isDuplicate
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30"
                  }`}
                >
                  {isOwned ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : isDuplicate ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOwned
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : isDuplicate
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                      }`}
                    >
                      {isOwned ? "Already Owned" : isDuplicate ? "Possible Duplicate" : "New Book"}
                    </span>
                    {scan.match_confidence !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round((scan.match_confidence || 0) * 100)}% match
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-foreground line-clamp-1">
                    {scan.detected_title || (scan.scanned_isbn ? `ISBN ${scan.scanned_isbn}` : "Visual scan")}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {scan.detected_author && <span>{scan.detected_author}</span>}
                    {scan.scanned_isbn && <span className="font-mono">&bull; ISBN {scan.scanned_isbn}</span>}
                    {scan.detected_edition && <span>&bull; {scan.detected_edition}</span>}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {scan.matched_library_item_id && (
                  <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Link href={`/library/${scan.matched_library_item_id}`}>
                      <span>View Copy</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(scan.id)}
                  aria-label="Delete scan record"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
