import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { CartView } from "@/components/cart/cart-view";
import { getCartItems } from "@/lib/cart/queries";

export const metadata = {
  title: "Buying Planner Cart | BookGuard",
  description: "Plan your book fair and bookstore acquisitions before physically buying.",
};

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const items = await getCartItems(supabase, user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buying Planner Cart"
        description="Plan books you want to purchase at fairs and bookstores, calculate totals, and track your budget."
      />

      <CartView initialItems={items} userId={user.id} />
    </div>
  );
}
