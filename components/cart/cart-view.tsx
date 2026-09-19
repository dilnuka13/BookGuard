"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  ScanLine,
  Bookmark,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { CartItemCard } from "./cart-item-card";
import { CartSummary } from "./cart-summary";
import { CartBudget } from "./cart-budget";
import { PurchaseDialog } from "./purchase-dialog";
import { createClient } from "@/lib/supabase/client";
import {
  updateCartItem,
  removeFromCart,
  moveCartItemToWishlist,
  calculateCartTotals,
  getStoredBudget,
  setStoredBudget,
} from "@/lib/cart/queries";
import { markPurchasedAction } from "@/lib/purchases/queries";
import { syncLibraryToOfflineCache } from "@/lib/offline/library-cache";
import { triggerHaptic } from "@/lib/utils/haptics";
import type { CartItem, PurchaseInput } from "@/types/shopping";

interface CartViewProps {
  initialItems: CartItem[];
  userId: string;
}

export function CartView({ initialItems, userId }: CartViewProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<CartItem[]>(initialItems);
  const [budget, setBudget] = React.useState<number | null>(null);
  const [activeItemForPurchase, setActiveItemForPurchase] = React.useState<CartItem | null>(null);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Initialize stored session budget on client mount
  React.useEffect(() => {
    setBudget(getStoredBudget());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateBudget = (newBudget: number | null) => {
    setBudget(newBudget);
    setStoredBudget(newBudget);
    showToast(newBudget !== null ? "Budget limit updated." : "Budget limit cleared.");
  };

  const handleUpdateQuantity = async (id: string, qty: number) => {
    const supabase = createClient();
    const res = await updateCartItem(supabase, userId, id, { quantity: qty });
    if (res.data) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
      );
    }
  };

  const handleUpdatePrice = async (id: string, price: number | null) => {
    const supabase = createClient();
    const res = await updateCartItem(supabase, userId, id, { price });
    if (res.data) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, price } : i))
      );
      showToast("Price updated.");
    }
  };

  const handleUpdateSeller = async (id: string, seller: string | null) => {
    const supabase = createClient();
    const res = await updateCartItem(supabase, userId, id, { seller });
    if (res.data) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, seller } : i))
      );
      showToast("Seller updated.");
    }
  };

  const handleRemove = async (id: string) => {
    const supabase = createClient();
    const success = await removeFromCart(supabase, userId, id);
    if (success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast("Item removed from cart planner.");
      router.refresh();
    }
  };

  const handleMoveToWishlist = async (item: CartItem) => {
    const supabase = createClient();
    const res = await moveCartItemToWishlist(supabase, userId, item);
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(`"${item.title}" moved to Wishlist.`);
      router.refresh();
    } else {
      showToast(`Error: ${res.error || "Could not move to wishlist"}`);
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
      const result = await markPurchasedAction(supabase, userId, input);

      if (result.success) {
        triggerHaptic("success");
        setItems((prev) => prev.filter((i) => i.id !== input.cartItemId));
        setActiveItemForPurchase(null);
        showToast(
          result.isExistingCopy
            ? "Updated copy quantity in My Library & saved purchase record!"
            : "Cataloged in My Library & saved purchase record!"
        );

        // Background update offline cache after purchase
        syncLibraryToOfflineCache(supabase, userId).catch(() => {});
        router.refresh();
      } else {
        triggerHaptic("error");
        showToast(`Failed: ${result.error || "Purchase could not be recorded"}`);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleMarkAllPurchased = async () => {
    try {
      setIsMarkingAll(true);
      const supabase = createClient();
      let successCount = 0;

      for (const item of items) {
        const res = await markPurchasedAction(supabase, userId, {
          cartItemId: item.id,
          price: item.price,
          quantity: item.quantity,
          seller: item.seller,
          notes: item.notes,
        });
        if (res.success) {
          successCount++;
        }
      }

      setItems([]);
      showToast(`Successfully purchased and added ${successCount} books to your library!`);
      syncLibraryToOfflineCache(supabase, userId).catch(() => {});
      router.refresh();
    } catch (err) {
      console.error("Mark all purchased error:", err);
      showToast("Some books could not be processed.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const summary = React.useMemo(() => {
    return calculateCartTotals(items, budget);
  }, [items, budget]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-card border border-border px-4 py-3 shadow-lg text-sm font-medium text-foreground flex items-center gap-2 animate-scale-in">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Quick Links */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
            <Link href="/wishlist">
              <Bookmark className="h-4 w-4" />
              <span>Wishlist</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
            <Link href="/purchases">
              <span>Purchase History</span>
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="brandGradient" size="sm" className="gap-2">
            <Link href="/cart/fair">
              <Compass className="h-4 w-4" />
              <span>Book Fair Mode</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
            <Link href="/scan">
              <ScanLine className="h-4 w-4" />
              <span>Scan Next</span>
            </Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          badge="Buying Planner"
          title="Your book fair cart is empty"
          description="Plan books you want to buy while scanning at book fairs or browsing your wishlist."
          actionLabel="Open Scanner"
          actionHref="/scan"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdatePrice={handleUpdatePrice}
                onUpdateSeller={handleUpdateSeller}
                onMoveToWishlist={handleMoveToWishlist}
                onRemove={handleRemove}
                onOpenPurchaseDialog={(it) => setActiveItemForPurchase(it)}
              />
            ))}
          </div>

          {/* Sidebar Summary & Budget */}
          <div className="space-y-4">
            <CartBudget summary={summary} onUpdateBudget={handleUpdateBudget} />
            <CartSummary
              summary={summary}
              onMarkAllPurchased={items.length > 1 ? handleMarkAllPurchased : undefined}
              isMarkingAll={isMarkingAll}
            />
          </div>
        </div>
      )}

      {/* Mark As Purchased Dialog */}
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
