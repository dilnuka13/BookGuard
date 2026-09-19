import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { BulkAddForm } from "@/components/library/bulk-add-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BulkAddPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/library">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Bulk Add Mode"
        description="Quickly catalog your physical bookshelf. Type the title, press Enter, and move immediately to the next book."
      />

      <BulkAddForm />
    </div>
  );
}
