import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  LibraryItem,
  LibraryFilters,
  LibrarySortOption,
} from "@/types/library";
import { trackISBN } from "@/lib/isbn/tracker";

export interface LibraryQueryParams {
  userId: string;
  filters?: LibraryFilters;
  sort?: LibrarySortOption;
  page?: number;
  pageSize?: number;
}

export interface LibraryQueryResult {
  items: LibraryItem[];
  totalCount: number;
  hasMore: boolean;
  page: number;
}

/**
 * Fetches filtered, searched, and sorted library items for a user with pagination.
 */
export async function getLibraryItems(
  supabase: SupabaseClient<Database>,
  params: LibraryQueryParams
): Promise<LibraryQueryResult> {
  const {
    userId,
    filters = {},
    sort = "recent",
    page = 1,
    pageSize = 24,
  } = params;

  let query = supabase
    .from("library_items")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  // 1. Text Search across Title, Author, ISBNs, Publisher, and Book Code
  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `title.ilike.%${term}%,author.ilike.%${term}%,isbn13.ilike.%${term}%,isbn10.ilike.%${term}%,publisher.ilike.%${term}%,book_code.ilike.%${term}%`
    );
  }

  // 2. Structured Filters
  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.language) {
    query = query.eq("language", filters.language);
  }

  if (filters.author) {
    query = query.ilike("author", `%${filters.author.trim()}%`);
  }

  if (filters.publishedYear) {
    query = query.eq("published_year", filters.publishedYear);
  }

  if (filters.isbnStatus === "without-isbn") {
    query = query.is("isbn13", null).is("isbn10", null);
  } else if (filters.isbnStatus === "with-isbn") {
    query = query.or("isbn13.not.is.null,isbn10.not.is.null");
  }

  // 3. Sorting
  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "title-asc":
      query = query.order("title", { ascending: true, nullsFirst: false });
      break;
    case "title-desc":
      query = query.order("title", { ascending: false, nullsFirst: false });
      break;
    case "author-asc":
      query = query.order("author", { ascending: true, nullsFirst: false });
      break;
    case "year-desc":
      query = query.order("published_year", { ascending: false, nullsFirst: false });
      break;
    case "year-asc":
      query = query.order("published_year", { ascending: true, nullsFirst: false });
      break;
    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // 4. Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("Error fetching library items:", error);
    throw new Error(`Failed to load library items: ${error.message}`);
  }

  const items = (data as LibraryItem[]) || [];
  const totalCount = count || 0;
  const hasMore = totalCount > to + 1;

  return {
    items,
    totalCount,
    hasMore,
    page,
  };
}

/**
 * Retrieves aggregate metadata (distinct categories and languages) for filter options.
 */
export async function getLibraryFilterOptions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ categories: string[]; languages: string[]; totalBooks: number }> {
  const { data, count, error } = await supabase
    .from("library_items")
    .select("category, language", { count: "exact" })
    .eq("user_id", userId);

  if (error) {
    console.warn("Could not fetch filter options:", error);
    return { categories: [], languages: [], totalBooks: 0 };
  }

  const categories = Array.from(
    new Set(
      data
        .map((row) => row.category)
        .filter((cat): cat is string => Boolean(cat && cat.trim()))
    )
  ).sort();

  const languages = Array.from(
    new Set(
      data
        .map((row) => row.language)
        .filter((lang): lang is string => Boolean(lang && lang.trim()))
    )
  ).sort();

  return {
    categories,
    languages,
    totalBooks: count || 0,
  };
}

/**
 * Retrieves a single book by ID verifying owner identity.
 */
export async function getBookById(
  supabase: SupabaseClient<Database>,
  userId: string,
  bookId: string
): Promise<LibraryItem | null> {
  const { data, error } = await supabase
    .from("library_items")
    .select("*")
    .eq("id", bookId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching book by ID:", error);
    return null;
  }

  return data as LibraryItem | null;
}

/**
 * Fetches recent books for dashboard display.
 */
export async function getRecentlyAddedBooks(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 6
): Promise<LibraryItem[]> {
  const { data, error } = await supabase
    .from("library_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recently added books:", error);
    return [];
  }

  return (data as LibraryItem[]) || [];
}

/**
 * Checks whether an exact ISBN is already registered in the user's personal library.
 * Executed BEFORE calling any external metadata APIs to save network requests and avoid delays.
 */
export async function checkExactIsbnInLibrary(
  supabase: SupabaseClient<Database>,
  userId: string,
  isbn: string
): Promise<LibraryItem | null> {
  const clean = isbn.trim().replace(/[-\s._]/g, "").toUpperCase();
  if (!clean) return null;

  // Cross-check counterpart format so ISBN-10 and ISBN-13 match the same book
  const tracked = trackISBN(clean);
  const conditions = [`isbn13.eq.${clean}`, `isbn10.eq.${clean}`, `barcode.eq.${clean}`];
  if (tracked.isValid) {
    if (tracked.isbn13 && tracked.isbn13 !== clean) {
      conditions.push(`isbn13.eq.${tracked.isbn13}`);
    }
    if (tracked.isbn10 && tracked.isbn10 !== clean) {
      conditions.push(`isbn10.eq.${tracked.isbn10}`);
    }
  }

  const { data, error } = await supabase
    .from("library_items")
    .select("*")
    .eq("user_id", userId)
    .or(conditions.join(","))
    .maybeSingle();

  if (error) {
    console.error("Error checking exact ISBN in library:", error);
    return null;
  }

  return (data as LibraryItem) || null;
}

/**
 * Fetches lightweight candidates from the authenticated user's library for multi-signal duplicate matching.
 */
export async function getMatchCandidates(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from("library_items")
    .select(
      "id, book_code, title, normalized_title, author, normalized_author, isbn10, isbn13, barcode, edition, publisher, published_year, cover_url, cover_hash, ocr_text, quantity"
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching match candidates:", error);
    return [];
  }

  const items = data || [];

  // Auto-backfill existing books in background if they only have one ISBN format
  if (items.length > 0) {
    const needSync = items.filter((item) => {
      const has13 = Boolean(item.isbn13 && item.isbn13.trim());
      const has10 = Boolean(item.isbn10 && item.isbn10.trim());
      return (has13 && !has10) || (has10 && !has13);
    });

    if (needSync.length > 0) {
      setTimeout(async () => {
        try {
          for (const item of needSync) {
            const tracked = trackISBN(item.isbn13 || item.isbn10 || "");
            if (tracked.isValid) {
              const updatePayload: { isbn13?: string; isbn10?: string } = {};
              if (tracked.isbn13 && !item.isbn13) {
                updatePayload.isbn13 = tracked.isbn13;
                item.isbn13 = tracked.isbn13;
              }
              if (tracked.isbn10 && !item.isbn10) {
                updatePayload.isbn10 = tracked.isbn10;
                item.isbn10 = tracked.isbn10;
              }
              if (Object.keys(updatePayload).length > 0) {
                await supabase
                  .from("library_items")
                  .update(updatePayload)
                  .eq("id", item.id);
              }
            }
          }
        } catch (e) {
          console.warn("Background ISBN backfill warning:", e);
        }
      }, 200);
    }
  }

  return items;
}

