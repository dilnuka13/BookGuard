"use client";

import * as React from "react";
import Image from "next/image";
import { BookOpen, ShoppingCart, Trash2, Edit3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import type { WishlistItem } from "@/types/shopping";

interface WishlistCardProps {
  item: WishlistItem;
  onMoveToCart: (item: WishlistItem) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onUpdatePrice: (id: string, price: number | null) => Promise<void>;
}

export function WishlistCard({
  item,
  onMoveToCart,
  onRemove,
  onUpdatePrice,
}: WishlistCardProps) {
  const [isMoving, setIsMoving] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [isEditingPrice, setIsEditingPrice] = React.useState(false);
  const [priceInput, setPriceInput] = React.useState(
    item.estimated_price !== null ? item.estimated_price.toString() : ""
  );

  const handleMove = async () => {
    try {
      setIsMoving(true);
      await onMoveToCart(item);
    } finally {
      setIsMoving(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      await onRemove(item.id);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSavePrice = async () => {
    const parsed = priceInput.trim() === "" ? null : parseFloat(priceInput);
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) return;
    await onUpdatePrice(item.id, parsed);
    setIsEditingPrice(false);
  };

  return (
    <div className="group relative flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/80 hover:shadow-md">
      {/* Cover Image */}
      <div className="relative aspect-[2/3] w-20 sm:w-24 shrink-0 rounded-xl overflow-hidden bg-muted border border-border self-center sm:self-start">
        {item.cover_url ? (
          <Image
            src={item.cover_url}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 80px, 96px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
            <BookOpen className="h-6 w-6 opacity-40" />
          </div>
        )}
      </div>

      {/* Book Information */}
      <div className="flex-1 min-w-0 space-y-2 w-full">
        <div>
          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {item.author || "Unknown author"}
          </p>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          {item.edition && (
            <span className="rounded-md bg-muted px-2 py-0.5 font-medium">
              {item.edition}
            </span>
          )}
          {item.published_year && (
            <span className="rounded-md bg-muted px-2 py-0.5">
              {item.published_year}
            </span>
          )}
          {item.isbn13 && (
            <span className="font-mono text-[10px] text-muted-foreground/80 rounded-md bg-muted/60 px-1.5 py-0.5">
              {item.isbn13}
            </span>
          )}
        </div>

        {/* Estimated Price Section */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <span className="text-muted-foreground font-medium">Est. Price:</span>
          {isEditingPrice ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min="0"
                step="50"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="Rs."
                className="h-7 w-28 text-xs px-2"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSavePrice}
                className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                aria-label="Save price"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setPriceInput(item.estimated_price !== null ? item.estimated_price.toString() : "");
                  setIsEditingPrice(false);
                }}
                className="h-7 w-7 text-muted-foreground"
                aria-label="Cancel editing"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">
                {formatCurrency(item.estimated_price)}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingPrice(true)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Edit estimated price"
              >
                <Edit3 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {item.notes && (
          <p className="text-xs italic text-muted-foreground/90 bg-muted/30 rounded-lg p-2 mt-1">
            &ldquo;{item.notes}&rdquo;
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant="brandGradient"
            onClick={handleMove}
            disabled={isMoving}
            className="flex-1 sm:flex-initial gap-1.5 text-xs h-8"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{isMoving ? "Moving..." : "Move to Cart"}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2.5"
            aria-label="Remove from wishlist"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:inline-block sm:text-xs">
              Remove
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
