export interface CommunityBookMetadata {
  found: boolean;
  title: string;
  author: string | null;
  publisher: string | null;
  edition: string | null;
  published_year: number | null;
  language: string | null;
  category: string | null;
  cover_url: string | null;
  cover_hash: string | null;
  isbn13: string | null;
  isbn10: string | null;
}

/**
 * Searches the BookGuard system database across all users for bibliographic
 * metadata matching the given ISBN.
 */
export async function lookupCommunityBook(
  isbn: string
): Promise<CommunityBookMetadata | null> {
  if (!isbn || !isbn.trim()) return null;

  try {
    const res = await fetch(
      `/api/books/community-lookup?isbn=${encodeURIComponent(isbn.trim())}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (data.success && data.found && data.book) {
      return data.book as CommunityBookMetadata;
    }
    return null;
  } catch (err) {
    console.warn("Community book lookup error:", err);
    return null;
  }
}
