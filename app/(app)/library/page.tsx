import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { LibraryView } from "@/components/library/library-view";
import { getLibraryItems, getLibraryFilterOptions } from "@/lib/books/queries";

export default async function LibraryPage() {
  const headersList = await headers();
  const userId = headersList.get("x-bookguard-user-id") ?? "";

  const supabase = await createClient();

  // Fetch initial books and distinct categories/languages in parallel
  const [libraryData, filterOptions] = await Promise.all([
    getLibraryItems(supabase, {
      userId,
      page: 1,
      pageSize: 24,
      sort: "recent",
    }),
    getLibraryFilterOptions(supabase, userId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Library"
        description="Browse, search, and manage books in your collection."
      />

      <LibraryView
        initialItems={libraryData.items}
        initialTotalCount={libraryData.totalCount}
        availableCategories={filterOptions.categories}
        availableLanguages={filterOptions.languages}
        userId={userId}
      />
    </div>
  );
}

