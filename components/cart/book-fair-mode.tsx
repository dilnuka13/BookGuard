"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ScanLine,
  CheckCircle2,
  Trash2,
  Bookmark,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PurchaseDialog } from "./purchase-dialog";
import { createClient } from "@/lib/supabase/client";
import {
  removeFromCart,
  moveCartItemToWishlist,
  calculateCartTotals,
  getStoredBudget,
} from "@/lib/cart/queries";
import { markPurchasedAction } from "@/lib/purchases/queries";
import { syncLibraryToOfflineCache } from "@/lib/offline/library-cache";
import { formatCurrency } from "@/lib/utils/currency";
import { triggerHaptic } from "@/lib/utils/haptics";
import type { CartItem, PurchaseInput } from "@/types/shopping";

interface BookFairModeProps {
  initialItems: CartItem[];
  userId: string;
}

export function BookFairMode({ initialItems, userId }: BookFairModeProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<CartItem[]>(initialItems);
  const [budget, setBudget] = React.useState<number | null>(null);
  const [activeItemForPurchase, setActiveItemForPurchase] = React.useState<CartItem | null>(null);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setBudget(getStoredBudget());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totals = React.useMemo(() => {
    return calculateCartTotals(items, budget);
  }, [items, budget]);

  const handleRemove = async (id: string) => {
    const supabase = createClient();
    const success = await removeFromCart(supabase, userId, id);
    if (success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast("Book removed.");
      router.refresh();
    }
  };

  const handleMoveToWishlist = async (item: CartItem) => {
    const supabase = createClient();
    const res = await moveCartItemToWishlist(supabase, userId, item);
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast("Saved to Wishlist.");
      router.refresh();
    }
  };

  const handleConfirmPurchase = async (input: PurchaseInput) => {
    // Offline safety block: Purchases modify authoritative records and cannot run offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      triggerHaptic("warning");
      showToast("Purchase confirmation requires an internet connection.");
      return;
    }

    try {
      setIsPurchasing(true);
      const supabase = createClient();
      const res = await markPurchasedAction(supabase, userId, input);

      if (res.success) {
        triggerHaptic("success");
        setItems((prev) => prev.filter((i) => i.id !== input.cartItemId));
        setActiveItemForPurchase(null);
        showToast(
          res.isExistingCopy
            ? "Updated in My Library & recorded purchase!"
            : "Purchased & cataloged in My Library!"
        );
        syncLibraryToOfflineCache(supabase, userId).catch(() => {});
        router.refresh();
      } else {
        triggerHaptic("error");
        showToast(`Failed: ${res.error || "Purchase could not be recorded"}`);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-card border border-border px-4 py-3 shadow-lg text-xs font-semibold text-foreground flex items-center gap-2 animate-scale-in">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-xs">
          <Link href="/cart">
            <ArrowLeft className="h-4 w-4" />
            <span>Standard Cart</span>
          </Link>
        </Button>

        <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
          <Sparkles className="h-3 w-3" />
          <span>Book Fair Mode</span>
        </div>
      </div>

      {/* Primary Sticky Planned Spend & Book Count Card */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/10 p-5 shadow-lg space-y-3">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-muted/50 p-3">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Books Planned
            </span>
            <span className="text-2xl font-black text-foreground">
              {totals.totalQuantity}
            </span>
          </div>

          <div className="rounded-2xl bg-muted/50 p-3">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Planned Spend
            </span>
            <span className="text-xl sm:text-2xl font-black text-primary">
              {formatCurrency(totals.cartTotal, { decimals: 0 })}
            </span>
          </div>
        </div>

        {budget !== null && (
          <div className="flex items-center justify-between text-xs px-2 pt-1">
            <span className="text-muted-foreground">
              Budget: <strong>{formatCurrency(budget, { decimals: 0 })}</strong>
            </span>
            <span
              className={
                totals.isOverBudget
                  ? "font-bold text-rose-600 dark:text-rose-400"
                  : "font-bold text-emerald-600 dark:text-emerald-400"
              }
            >
              {totals.isOverBudget
                ? `Over by ${formatCurrency(Math.abs(totals.remaining || 0), { decimals: 0 })}`
                : `${formatCurrency(totals.remaining, { decimals: 0 })} left`}
            </span>
          </div>
        )}

        {/* Primary Large Scan Action */}
        <Button
          asChild
          variant="brandGradient"
          size="lg"
          className="w-full h-14 text-base font-bold gap-2 shadow-lg shadow-emerald-600/25 rounded-2xl"
        >
          <Link href="/scan">
            <ScanLine className="h-5 w-5" />
            <span>Scan Next Book</span>
          </Link>
        </Button>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">Cart is currently clear</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Scan barcodes as you explore book fair stalls to verify your shelf and plan your purchases.
          </p>
          <Button asChild variant="brandGradient" size="sm" className="gap-2">
            <Link href="/scan">
              <ScanLine className="h-4 w-4" />
              <span>Start Scanning</span>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Planned Purchases ({items.length})
          </h3>

          {items.map((item) => {
            const unitPrice = item.price !== null ? Number(item.price) : null;
            const subtotal = unitPrice !== null ? unitPrice * (item.quantity || 1) : null;

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
              >
                {/* Thumbnail */}
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

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.author || "Unknown author"}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5 text-xs">
                    <span className="font-semibold text-primary">
                      {subtotal !== null ? formatCurrency(subtotal, { decimals: 0 }) : "No price"}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-muted-foreground">
                        ({item.quantity}x)
                      </span>
                    )}
                    {item.seller && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                        &bull; {item.seller}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick One-Tap Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="brandGradient"
                    onClick={() => setActiveItemForPurchase(item)}
                    className="h-8 px-2.5 text-xs rounded-xl"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    <span>Bought</span>
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMoveToWishlist(item)}
                    className="h-8 w-8 text-muted-foreground"
                    title="Save to Wishlist"
                    aria-label="Save to Wishlist"
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(item.id)}
                    className="h-8 w-8 text-destructive"
                    title="Remove"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mark Purchased Dialog */}
      <PurchaseDialog
        item={activeItemForPurchase}
        isOpen={Boolean(activeItemForPurchase)}
        onClose={() => setActiveItemForPurchase(null)}
        onConfirm={handleConfirmPurchase}
        isSubmitting={isPurchasing}
      />
    </div>
  );
}
