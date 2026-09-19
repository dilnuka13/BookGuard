"use client";

import * as React from "react";
import Image from "next/image";
import {
  CheckCircle2,
  BookOpen,
  Calendar,
  Store,
  Tag,
  Hash,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CartItem, PurchaseInput } from "@/types/shopping";

interface PurchaseDialogProps {
  item: CartItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (input: PurchaseInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function PurchaseDialog({
  item,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: PurchaseDialogProps) {
  const [price, setPrice] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [seller, setSeller] = React.useState<string>("");
  const [purchaseDate, setPurchaseDate] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  React.useEffect(() => {
    if (item) {
      setPrice(item.price !== null ? item.price.toString() : "");
      setQuantity(Math.max(1, item.quantity || 1));
      setSeller(item.seller || "");
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setNotes(item.notes || "");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = price.trim() === "" ? null : parseFloat(price);
    await onConfirm({
      cartItemId: item.id,
      purchaseDate: purchaseDate || new Date().toISOString().split("T")[0],
      price: parsedPrice,
      quantity: Math.max(1, quantity),
      seller: seller.trim() || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-scale-in">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Mark as Purchased</h2>
            <p className="text-xs text-muted-foreground">
              Confirm purchase details to automatically catalog this into My Library.
            </p>
          </div>
        </div>

        {/* Selected Book Summary */}
        <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3 border border-border/60">
          <div className="relative aspect-[2/3] w-12 shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
            {item.cover_url ? (
              <Image
                src={item.cover_url}
                alt={item.title}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <BookOpen className="h-4 w-4 opacity-40" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-foreground truncate">{item.title}</h4>
            <p className="text-xs text-muted-foreground truncate">{item.author || "Unknown author"}</p>
            {item.isbn13 && (
              <span className="font-mono text-[10px] text-muted-foreground/80">
                ISBN: {item.isbn13}
              </span>
            )}
          </div>
        </div>

        {/* Purchase Details Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Purchase Price */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Tag className="h-3 w-3 text-muted-foreground" /> Actual Price (Rs.)
              </label>
              <Input
                type="number"
                min="0"
                step="50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Rs."
                className="h-9 text-sm"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Hash className="h-3 w-3 text-muted-foreground" /> Quantity
              </label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-9 text-sm"
              />
            </div>

            {/* Seller / Store */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Store className="h-3 w-3 text-muted-foreground" /> Seller / Bookshop
              </label>
              <Input
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                placeholder="e.g. Sarasavi / Stall 12"
                className="h-9 text-sm"
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" /> Purchase Date
              </label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Notes (Optional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bought at Colombo International Book Fair 2026"
              className="h-9 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="brandGradient"
              disabled={isSubmitting}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Cataloging..." : "Confirm & Add to Library"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
