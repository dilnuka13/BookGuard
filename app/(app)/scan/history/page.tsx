import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRecentScans } from "@/lib/scanner/history";
import { PageHeader } from "@/components/layout/page-header";
import { ScanHistoryList } from "@/components/scan-history/scan-history-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ScanLine } from "lucide-react";

export default async function ScanHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const scans = await getRecentScans(supabase, user.id, 100);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/scan">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Scanner</span>
          </Link>
        </Button>

        <Button asChild variant="brandGradient" size="sm" className="gap-1.5 rounded-xl">
          <Link href="/scan">
            <ScanLine className="h-3.5 w-3.5" />
            <span>Scan Book</span>
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Duplicate Defense History"
        description="Review previous scans, verify duplicate alerts, and manage past check records."
      />

      <ScanHistoryList initialScans={scans} userId={user.id} />
    </div>
  );
}
