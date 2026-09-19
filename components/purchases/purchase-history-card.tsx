"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Calendar, Store, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import type { PurchaseHistoryItem } from "@/types/shopping";

interface PurchaseHistoryCardProps {
  item: PurchaseHistoryItem;
}

export function PurchaseHistoryCard({ item }: PurchaseHistoryCardProps) {
  const displayTotal =
    item.total_amount !== null
      ? item.total_amount
      : item.price !== null
      ? Number(item.price) * (item.quantity || 1)
      : null;

  return (
    <div className="group relative flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/80 hover:shadow-md">
      {/* Cover Image */}
      <div className="relative aspect-[2/3] w-16 sm:w-20 shrink-0 rounded-xl overflow-hidden bg-muted border border-border self-center sm:self-start">
        {item.cover_url ? (
          <Image
            src={item.cover_url}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 64px, 80px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
            <BookOpen className="h-6 w-6 opacity-40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2 w-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
          <div>
            <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
              {item.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.author || "Unknown author"}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-base font-extrabold text-primary block">
              {formatCurrency(displayTotal)}
            </span>
            {item.quantity > 1 && item.price !== null && (
              <span className="text-[10px] text-muted-foreground block">
                {item.quantity} × {formatCurrency(item.price)}
              </span>
            )}
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{item.purchase_date}</span>
          </div>

          {item.seller && (
            <div className="flex items-center gap-1">
              <Store className="h-3.5 w-3.5" />
              <span>{item.seller}</span>
            </div>
          )}

          {item.edition && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">
              {item.edition}
            </span>
          )}

          {item.isbn13 && (
            <span className="font-mono text-[10px] text-muted-foreground/80">
              {item.isbn13}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="text-xs italic text-muted-foreground/90 bg-muted/30 rounded-lg p-2 mt-1">
            &ldquo;{item.notes}&rdquo;
          </p>
        )}

        {/* Link to Library Item */}
        {item.library_item_id && (
          <div className="pt-2 flex justify-end">
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary">
              <Link href={`/library/${item.library_item_id}`}>
                <span>View in Library</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
