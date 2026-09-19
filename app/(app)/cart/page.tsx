import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { CartView } from "@/components/cart/cart-view";
import { getCartItems } from "@/lib/cart/queries";

export const metadata = {
  title: "Buying Planner Cart | BookGuard",
  description: "Plan your book fair and bookstore acquisitions before physically buying.",
};

export default async function CartPage() {
  const headersList = await headers();
  const userId = headersList.get("x-bookguard-user-id") ?? "";

  const supabase = await createClient();
  const items = await getCartItems(supabase, userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buying Planner Cart"
        description="Plan books you want to purchase at fairs and bookstores, calculate totals, and track your budget."
      />

      <CartView initialItems={items} userId={userId} />
    </div>
  );
}

