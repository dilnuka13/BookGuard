import { headers } from "next/headers";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ScannerClientWrapper } from "@/components/scanner/scanner-client-wrapper";
import { Button } from "@/components/ui/button";
import { History, Plus } from "lucide-react";

export default async function ScanPage() {
  const headersList = await headers();
  const userId = headersList.get("x-bookguard-user-id") ?? "";

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Smart Scanner"
          description="Point your camera at a barcode or cover to verify ownership."
        />

        <div className="flex items-center gap-2 self-start mt-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <Link href="/library/add">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Manually</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <Link href="/scan/history">
              <History className="h-3.5 w-3.5" />
              <span>History</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Scanner Container (Client Dynamic Bundle) */}
      <ScannerClientWrapper userId={userId} />
    </div>
  );
}

