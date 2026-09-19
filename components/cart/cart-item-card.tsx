"use client";

import * as React from "react";
import Image from "next/image";
import {
  BookOpen,
  CheckCircle2,
  Bookmark,
  Trash2,
  Plus,
  Minus,
  Store,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import type { CartItem } from "@/types/shopping";

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => Promise<void>;
  onUpdatePrice: (id: string, price: number | null) => Promise<void>;
  onUpdateSeller: (id: string, seller: string | null) => Promise<void>;
  onMoveToWishlist: (item: CartItem) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onOpenPurchaseDialog: (item: CartItem) => void;
}

export function CartItemCard({
  item,
  onUpdateQuantity,
  onUpdatePrice,
  onUpdateSeller,
  onMoveToWishlist,
  onRemove,
  onOpenPurchaseDialog,
}: CartItemCardProps) {
  const [isEditingPrice, setIsEditingPrice] = React.useState(false);
  const [priceVal, setPriceVal] = React.useState(
    item.price !== null ? item.price.toString() : ""
  );

  const [isEditingSeller, setIsEditingSeller] = React.useState(false);
  const [sellerVal, setSellerVal] = React.useState(item.seller || "");

  const unitPrice = item.price !== null ? Number(item.price) : null;
  const quantity = Math.max(1, item.quantity || 1);
  const subtotal = unitPrice !== null ? unitPrice * quantity : null;

  const handleSavePrice = async () => {
    const parsed = priceVal.trim() === "" ? null : parseFloat(priceVal);
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) return;
    await onUpdatePrice(item.id, parsed);
    setIsEditingPrice(false);
  };

  const handleSaveSeller = async () => {
    const clean = sellerVal.trim() || null;
    await onUpdateSeller(item.id, clean);
    setIsEditingSeller(false);
  };

  return (
    <div className="group relative flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/80 hover:shadow-md">
      {/* Book Cover */}
      <div className="relative aspect-[2/3] w-20 sm:w-24 shrink-0 rounded-xl overflow-hidden bg-muted border border-border self-center sm:self-start">
        {item.cover_url ? (
          <Image
            src={item.cover_url}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 80px, 96px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
            <BookOpen className="h-6 w-6 opacity-40" />
          </div>
        )}
      </div>

      {/* Book Info & Plan Details */}
      <div className="flex-1 min-w-0 space-y-2.5 w-full">
        <div>
          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {item.author || "Unknown author"}
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mt-1">
            {item.edition && (
              <span className="rounded-md bg-muted px-2 py-0.5 font-medium">
                {item.edition}
              </span>
            )}
            {item.isbn13 && (
              <span className="font-mono text-[10px] text-muted-foreground/80 rounded-md bg-muted/60 px-1.5 py-0.5">
                {item.isbn13}
              </span>
            )}
          </div>
        </div>

        {/* Pricing, Quantity & Seller Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-muted/30 p-2.5 border border-border/50 text-xs">
          {/* Unit Price */}
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" /> Unit Price
            </span>
            {isEditingPrice ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={priceVal}
                  onChange={(e) => setPriceVal(e.target.value)}
                  placeholder="Rs."
                  className="h-7 w-20 text-xs px-1.5"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSavePrice}
                  className="h-7 px-2 text-[10px]"
                >
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">
                  {formatCurrency(item.price)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingPrice(true)}
                  className="text-primary hover:underline text-[11px]"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Quantity Stepper */}
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Quantity</span>
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="outline"
                onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                disabled={quantity <= 1}
                className="h-6 w-6 rounded-md"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center font-bold text-foreground">
                {quantity}
              </span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                className="h-6 w-6 rounded-md"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Subtotal */}
          <div className="space-y-1 sm:text-right">
            <span className="text-muted-foreground font-medium">Subtotal</span>
            <div>
              <span className="font-bold text-sm text-foreground">
                {subtotal !== null ? formatCurrency(subtotal) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Store className="h-3.5 w-3.5 shrink-0" />
          {isEditingSeller ? (
            <div className="flex items-center gap-1.5 flex-1">
              <Input
                value={sellerVal}
                onChange={(e) => setSellerVal(e.target.value)}
                placeholder="e.g. Sarasavi / Stall 42"
                className="h-7 text-xs px-2"
                autoFocus
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveSeller}
                className="h-7 px-2 text-[10px]"
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span>Seller:</span>
              <span className="font-medium text-foreground">
                {item.seller || "Unspecified bookshop / stall"}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingSeller(true)}
                className="text-primary hover:underline text-[11px] ml-1"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Card Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant="brandGradient"
            onClick={() => onOpenPurchaseDialog(item)}
            className="gap-1.5 text-xs h-8 px-3"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Mark Purchased</span>
          </Button>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveToWishlist(item)}
              className="text-muted-foreground hover:text-foreground text-xs h-8 px-2.5"
            >
              <Bookmark className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Wishlist</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(item.id)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs h-8 px-2"
              aria-label="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
