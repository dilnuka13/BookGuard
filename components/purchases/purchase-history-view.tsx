"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Receipt,
  ScanLine,
  Compass,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { PurchaseHistoryCard } from "./purchase-history-card";
import { groupPurchasesByPeriod } from "@/lib/purchases/queries";
import { formatCurrency } from "@/lib/utils/currency";
import type { PurchaseHistoryItem } from "@/types/shopping";

interface PurchaseHistoryViewProps {
  initialItems: PurchaseHistoryItem[];
}

export function PurchaseHistoryView({ initialItems }: PurchaseHistoryViewProps) {
  const [items] = React.useState<PurchaseHistoryItem[]>(initialItems);
  const [search, setSearch] = React.useState("");
  const [selectedSeller, setSelectedSeller] = React.useState<string>("all");

  // Distinct sellers list for filter
  const sellers = React.useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      if (it.seller && it.seller.trim()) {
        set.add(it.seller.trim());
      }
    }
    return Array.from(set);
  }, [items]);

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      // 1. Text Search
      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const matches =
          item.title.toLowerCase().includes(term) ||
          (item.author && item.author.toLowerCase().includes(term)) ||
          (item.seller && item.seller.toLowerCase().includes(term)) ||
          (item.notes && item.notes.toLowerCase().includes(term)) ||
          (item.isbn13 && item.isbn13.includes(term));
        if (!matches) return false;
      }

      // 2. Seller Filter
      if (selectedSeller !== "all") {
        if (!item.seller || item.seller.trim() !== selectedSeller) {
          return false;
        }
      }

      return true;
    });
  }, [items, search, selectedSeller]);

  // Aggregate stats
  const { totalCount, totalSpend } = React.useMemo(() => {
    let spend = 0;
    for (const item of filteredItems) {
      if (item.total_amount !== null && !isNaN(Number(item.total_amount))) {
        spend += Number(item.total_amount);
      } else if (item.price !== null && !isNaN(Number(item.price))) {
        spend += Number(item.price) * (item.quantity || 1);
      }
    }
    return {
      totalCount: filteredItems.length,
      totalSpend: spend,
    };
  }, [filteredItems]);

  const grouped = React.useMemo(() => {
    return groupPurchasesByPeriod(filteredItems);
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium block">
              Purchases Recorded
            </span>
            <span className="text-xl font-extrabold text-foreground">
              {totalCount} {totalCount === 1 ? "Book" : "Books"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium block">
              Total Spend
            </span>
            <span className="text-xl font-extrabold text-primary">
              {formatCurrency(totalSpend)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search purchases by title, author, or seller..."
            className="pl-9 h-10 text-sm rounded-xl"
          />
        </div>

        {sellers.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="seller-filter" className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              Seller:
            </label>
            <select
              id="seller-filter"
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Sellers ({sellers.length})</option>
              {sellers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grouped Content or Empty State */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          badge="Purchases"
          title="No purchases recorded yet"
          description={
            search || selectedSeller !== "all"
              ? "No purchase records matched your current filters."
              : "When you acquire books at fairs or bookstores and mark them as purchased in your cart, your history will appear here."
          }
          actionLabel={search || selectedSeller !== "all" ? "Reset Filters" : "Go to Cart"}
          actionHref={search || selectedSeller !== "all" ? undefined : "/cart"}
          onAction={
            search || selectedSeller !== "all"
              ? () => {
                  setSearch("");
                  setSelectedSeller("all");
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Today Group */}
          {grouped.today.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary px-1">
                Today ({grouped.today.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.today.map((item) => (
                  <PurchaseHistoryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* This Month Group */}
          {grouped.thisMonth.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                This Month ({grouped.thisMonth.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.thisMonth.map((item) => (
                  <PurchaseHistoryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Older Group */}
          {grouped.older.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                Earlier Purchases ({grouped.older.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.older.map((item) => (
                  <PurchaseHistoryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
