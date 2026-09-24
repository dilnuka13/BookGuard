"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, Sparkles, Clock, ArrowRight, ScanLine } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ScanHistoryRow } from "@/lib/scanner/history";

interface RecentScansProps {
  scans: ScanHistoryRow[];
}

export function RecentScans({ scans }: RecentScansProps) {
  if (scans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <ScanLine className="h-4 w-4" />
              <span>Smart Scanner</span>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
              <Link href="/scan" className="flex items-center gap-1">
                <span>Open Scanner</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <CardTitle>Recent Checks</CardTitle>
          <CardDescription>
            Live history of books you have checked for duplicate prevention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-2">
              <ScanLine className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">No scans recorded yet</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Point your camera at any book barcode or cover to verify ownership instantly.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3 rounded-xl">
              <Link href="/scan">Start Scanning</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <ScanLine className="h-4 w-4" />
            <span>Recent Checks</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            <Link href="/scan/history" className="flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <CardTitle>Duplicate Defense History</CardTitle>
        <CardDescription>
          Books you recently checked before buying.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border/60">
          {scans.slice(0, 5).map((scan) => {
            const isOwned = scan.match_type === "OWNED";
            const isDuplicate = scan.match_type === "POSSIBLE_DUPLICATE";
            const isNew = scan.match_type === "NEW";

            const formattedDate = new Date(scan.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={scan.id}
                className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Indicator Icon */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isOwned
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : isDuplicate
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30"
                    }`}
                  >
                    {isOwned ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : isDuplicate ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {scan.detected_title || (scan.scanned_isbn ? `ISBN ${scan.scanned_isbn}` : "Unknown title")}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {scan.detected_author || (scan.scanned_isbn ? `ISBN ${scan.scanned_isbn}` : "Visual scan")}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOwned
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : isDuplicate
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                    }`}
                  >
                    {isOwned ? "Already Owned" : isDuplicate ? "Duplicate" : "New Book"}
                  </span>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    <span suppressHydrationWarning>{formattedDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
