import { headers } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { RecentlyAddedBooks } from "@/components/dashboard/recently-added-books";
import { RecentScans } from "@/components/scan-history/recent-scans";
import { getRecentlyAddedBooks } from "@/lib/books/queries";
import { getRecentScans } from "@/lib/scanner/history";
import {
  BookOpen,
  Bookmark,
  ShoppingCart,
  ScanLine,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";

export default async function DashboardPage() {
  const headersList = await headers();
  const userId = headersList.get("x-bookguard-user-id") ?? "";

  const supabase = await createClient();

  const [
    profileRes,
    libraryCountRes,
    wishlistCountRes,
    cartCountRes,
    purchaseCountRes,
    recentBooks,
    recentScans,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("library_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("wishlist_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("purchase_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    userId ? getRecentlyAddedBooks(supabase, userId, 6) : Promise.resolve([]),
    userId ? getRecentScans(supabase, userId, 5) : Promise.resolve([]),
  ]);

  const firstName =
    profileRes.data?.full_name?.split(" ")[0] ||
    "Reader";

  const totalBooksCount = libraryCountRes.count || 0;
  const wishlistCount = wishlistCountRes.count || 0;
  const cartCount = cartCountRes.count || 0;
  const purchaseCount = purchaseCountRes.count || 0;


  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Phase 04 &bull; Personal Buying Planner Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Know your shelf before you buy. Here is your current collection and purchasing overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:self-start">
          <Button asChild variant="brandGradient" size="lg">
            <Link href="/library/add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Book</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/scan" className="flex items-center gap-2">
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scanner</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Real Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="My Library"
          value={totalBooksCount}
          description="Books cataloged on shelf"
          icon={BookOpen}
        />
        <StatCard
          label="Wishlist"
          value={wishlistCount}
          description="Saved for future visits"
          icon={Bookmark}
        />
        <StatCard
          label="Cart Planner"
          value={cartCount}
          description="Planned acquisitions"
          icon={ShoppingCart}
        />
        <StatCard
          label="Purchases"
          value={purchaseCount}
          description="Acquired & logged"
          icon={ShieldCheck}
        />
      </div>

      {/* Primary Action Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-emerald-500/5 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>Personal Collection Shield</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {totalBooksCount === 0
                ? "Start building your digital bookshelf"
                : `You have ${totalBooksCount} ${totalBooksCount === 1 ? "book" : "books"} safeguarded`}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Every book you add strengthens your defense against accidental duplicate purchases in bookstores and online sales.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="brandGradient" size="lg">
              <Link href="/library/add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Book</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/library" className="flex items-center gap-2">
                <span>Browse Library</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Real Recently Added Shelf Section */}
      <RecentlyAddedBooks books={recentBooks} />

      {/* Real Recent Scans Section */}
      <RecentScans scans={recentScans} />

      {/* Workflow Philosophy Preview */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          How BookGuard Protects You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              STEP 1
            </span>
            <h3 className="font-bold text-sm text-foreground">Catalog Your Shelf</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Manually add books or use Bulk Add Mode to register your collection in minutes.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
              STEP 2
            </span>
            <h3 className="font-bold text-sm text-foreground">Normalized Indexes</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sinhala, Tamil, and English titles and authors are safely indexed for instant retrieval.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              STEP 3
            </span>
            <h3 className="font-bold text-sm text-foreground">Duplicate Defense</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Check your library anytime, anywhere before checking out at any bookstore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
