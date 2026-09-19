import type { BookMetadata, LookupResponse } from "./types";
import { normalizeISBN } from "./normalize";

/**
 * Client helper to fetch normalized book metadata via our server lookup route.
 */
export async function fetchBookMetadata(isbn: string): Promise<BookMetadata | null> {
  try {
    const cleanIsbn = normalizeISBN(isbn);
    if (!cleanIsbn) return null;

    const res = await fetch(`/api/books/lookup?isbn=${encodeURIComponent(cleanIsbn)}`);
    if (!res.ok) {
      return null;
    }

    const data: LookupResponse = await res.json();
    if (data.success && data.book) {
      return data.book;
    }

    return null;
  } catch (err) {
    console.error("fetchBookMetadata error:", err);
    return null;
  }
}
