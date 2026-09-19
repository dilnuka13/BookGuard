import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { PurchaseHistoryView } from "@/components/purchases/purchase-history-view";
import { getPurchaseHistory } from "@/lib/purchases/queries";

export const metadata = {
  title: "Purchase History | BookGuard",
  description: "Track your past book acquisitions and purchase snapshots.",
};

export default async function PurchasesPage() {
  const headersList = await headers();
  const userId = headersList.get("x-bookguard-user-id") ?? "";

  const supabase = await createClient();
  const items = await getPurchaseHistory(supabase, userId);

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

