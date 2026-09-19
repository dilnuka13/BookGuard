import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { OfflineLibraryItem } from "@/types/shopping";
import {
  cacheLibraryItems,
  findCachedBookByISBN,
  findCachedBookByTitle,
  getCachedLibraryItems,
  getSyncMeta,
} from "./db";

/**
 * Synchronizes the authenticated user's lightweight library items from Supabase into IndexedDB.
 */
export async function syncLibraryToOfflineCache(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ count: number; syncedAt: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("library_items")
      .select(
        "id, book_code, title, normalized_title, author, normalized_author, isbn10, isbn13, barcode, edition, publisher, cover_hash, cover_url, updated_at"
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching library items for offline sync:", error);
      return { count: 0, syncedAt: "", error: error.message };
    }

    const offlineItems: OfflineLibraryItem[] = (data || []).map((item) => ({
      id: item.id,
      book_code: item.book_code,
      title: item.title,
      normalized_title: item.normalized_title,
      author: item.author,
      normalized_author: item.normalized_author,
      isbn10: item.isbn10,
      isbn13: item.isbn13,
      barcode: item.barcode,
      edition: item.edition,
      publisher: item.publisher,
      cover_hash: item.cover_hash,
      cover_url: item.cover_url,
      updated_at: item.updated_at,
    }));

    await cacheLibraryItems(offlineItems, userId);
    const meta = await getSyncMeta();

    return {
      count: offlineItems.length,
      syncedAt: meta.lastSyncedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.error("Failed to sync library to offline cache:", err);
    return {
      count: 0,
      syncedAt: "",
      error: err instanceof Error ? err.message : "Sync error",
    };
  }
}

/**
 * Checks whether an ISBN is cached in local IndexedDB.
 * Works completely offline without active internet.
 */
export async function checkOfflineIsbn(isbn: string): Promise<OfflineLibraryItem | null> {
  return findCachedBookByISBN(isbn);
}

/**
 * Checks whether a title is cached in local IndexedDB.
 */
export async function checkOfflineTitle(title: string): Promise<OfflineLibraryItem | null> {
  return findCachedBookByTitle(title);
}

export { getCachedLibraryItems, getSyncMeta };
