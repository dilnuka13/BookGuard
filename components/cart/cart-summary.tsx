"use client";

import * as React from "react";
import Link from "next/link";
import {
  Compass,
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import type { BudgetSummary } from "@/types/shopping";

interface CartSummaryProps {
  summary: BudgetSummary & { totalQuantity: number };
  onMarkAllPurchased?: () => void;
  isMarkingAll?: boolean;
}

export function CartSummary({
  summary,
  onMarkAllPurchased,
  isMarkingAll = false,
}: CartSummaryProps) {
  const [showConfirmAll, setShowConfirmAll] = React.useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Buying Planner Summary</h3>
          <p className="text-xs text-muted-foreground">
            {summary.totalQuantity} {summary.totalQuantity === 1 ? "book" : "books"} planned
          </p>
        </div>

        <Button asChild variant="brandGradient" size="sm" className="gap-1.5 rounded-xl shadow-sm">
          <Link href="/cart/fair">
            <Compass className="h-4 w-4" />
            <span>Book Fair Mode</span>
          </Link>
        </Button>
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Priced Items ({summary.pricedItemCount})</span>
          <span>{formatCurrency(summary.cartTotal)}</span>
        </div>

        {summary.unpricedItemCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {summary.unpricedItemCount}{" "}
              {summary.unpricedItemCount === 1 ? "book has" : "books have"} no price specified yet. Not included in total.
            </span>
          </div>
        )}

        <div className="flex items-baseline justify-between pt-2 border-t border-border font-bold">
          <span className="text-foreground">Estimated Total</span>
          <span className="text-xl text-primary">
            {formatCurrency(summary.cartTotal)}
          </span>
        </div>
      </div>

      {/* Global Mark All Purchased Option (Safe Confirmation) */}
      {onMarkAllPurchased && (
        <div className="pt-2 border-t border-border/50">
          {showConfirmAll ? (
            <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-xs">
              <p className="font-semibold text-foreground">
                Mark all {summary.totalQuantity} books as purchased and add them to your library?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="brandGradient"
                  onClick={() => {
                    setShowConfirmAll(false);
                    onMarkAllPurchased();
                  }}
                  disabled={isMarkingAll}
                  className="gap-1.5 h-8 text-xs flex-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>{isMarkingAll ? "Processing..." : "Yes, Mark All"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirmAll(false)}
                  disabled={isMarkingAll}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmAll(true)}
              className="w-full gap-2 text-xs h-9 rounded-xl border-dashed hover:border-solid"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Mark All as Purchased</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
