import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { PurchaseHistoryView } from "@/components/purchases/purchase-history-view";
import { getPurchaseHistory } from "@/lib/purchases/queries";

export const metadata = {
  title: "Purchase History | BookGuard",
  description: "Track your past book acquisitions and purchase snapshots.",
};

export default async function PurchasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const items = await getPurchaseHistory(supabase, user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase History"
        description="Immutable records of your book fair and bookstore acquisitions."
      />

      <PurchaseHistoryView initialItems={items} />
    </div>
  );
}
