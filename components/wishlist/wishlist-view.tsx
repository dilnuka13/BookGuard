"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Search, ScanLine, ShoppingCart, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { WishlistCard } from "./wishlist-card";
import { createClient } from "@/lib/supabase/client";
import {
  removeFromWishlist,
  updateWishlistItem,
  moveWishlistItemToCart,
} from "@/lib/wishlist/queries";
import type { WishlistItem } from "@/types/shopping";

interface WishlistViewProps {
  initialItems: WishlistItem[];
  userId: string;
}

export function WishlistView({ initialItems, userId }: WishlistViewProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<WishlistItem[]>(initialItems);
  const [search, setSearch] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    const supabase = createClient();
    const res = await moveWishlistItemToCart(supabase, userId, item);
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(`"${item.title}" moved to your buying planner cart!`);
      router.refresh();
    } else {
      showToast(`Error: ${res.error || "Could not move item to cart"}`);
    }
  };

  const handleRemove = async (id: string) => {
    const supabase = createClient();
    const success = await removeFromWishlist(supabase, userId, id);
    if (success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast("Item removed from wishlist.");
      router.refresh();
    }
  };

  const handleUpdatePrice = async (id: string, price: number | null) => {
    const supabase = createClient();
    const res = await updateWishlistItem(supabase, userId, id, {
      estimated_price: price,
    });
    if (res.data) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, estimated_price: price } : i))
      );
      showToast("Estimated price updated.");
    }
  };

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items;
    const term = search.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        (item.author && item.author.toLowerCase().includes(term)) ||
        (item.publisher && item.publisher.toLowerCase().includes(term)) ||
        (item.isbn13 && item.isbn13.includes(term))
    );
  }, [items, search]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-card border border-border px-4 py-3 shadow-lg text-sm font-medium text-foreground flex items-center gap-2 animate-scale-in">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved books in wishlist..."
            className="pl-9 h-10 text-sm rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
            <Link href="/cart">
              <ShoppingCart className="h-4 w-4" />
              <span>View Cart</span>
            </Link>
          </Button>

          <Button asChild variant="brandGradient" size="sm" className="gap-2">
            <Link href="/scan">
              <ScanLine className="h-4 w-4" />
              <span>Scan Books</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Items Grid or Empty State */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          badge="Wishlist"
          title="Your wishlist is empty"
          description={
            search
              ? "No saved books matched your search query."
              : "Save books you want to remember for later when scanning or browsing."
          }
          actionLabel={search ? "Clear Search" : "Start Scanning"}
          actionHref={search ? undefined : "/scan"}
          onAction={search ? () => setSearch("") : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onMoveToCart={handleMoveToCart}
              onRemove={handleRemove}
              onUpdatePrice={handleUpdatePrice}
            />
          ))}
        </div>
      )}
    </div>
  );
}
