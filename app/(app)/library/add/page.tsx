import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { BookForm } from "@/components/library/book-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Layers } from "lucide-react";

export default function AddBookPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/library">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </Link>
        </Button>

        <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl">
          <Link href="/library/bulk-add">
            <Layers className="h-3.5 w-3.5" />
            <span>Bulk Add Mode</span>
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Add Book Manually"
        description="Enter book details and upload a cover to add it to your shelf."
      />

      {/* Smart Scanner Active Banner */}
      <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-foreground">
              Smart Book Scanner Active
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Have a book barcode or cover to scan? Use the camera scanner for instant duplicate checking and auto-fill.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 text-xs gap-1.5 rounded-xl">
          <Link href="/scan">
            <span>Open Scanner</span>
          </Link>
        </Button>
      </div>

      <BookForm mode="add" />
    </div>
  );
}
