import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { getWishlistItems } from "@/lib/wishlist/queries";

export const metadata = {
  title: "Wishlist | BookGuard",
  description: "Books you want to remember and acquire later.",
};

export default async function WishlistPage() {
  const headersList = await headers();
  const userId = headersList.get("x-bookguard-user-id") ?? "";

  const supabase = await createClient();
  const items = await getWishlistItems(supabase, userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wishlist"
        description="Save books you want to acquire or remember while browsing and scanning."
      />

      <WishlistView initialItems={items} userId={userId} />
    </div>
  );
}

