import { NextRequest, NextResponse } from "next/server";
import { inspectISBN } from "@/lib/isbn/validate";
import { normalizeISBN } from "@/lib/isbn/normalize";
import type { BookMetadata, LookupResponse } from "@/lib/isbn/types";

export const runtime = "nodejs";

// Timeout for external fetch calls in milliseconds
const EXTERNAL_TIMEOUT_MS = 6000;

async function fetchWithTimeout(url: string, timeoutMs = EXTERNAL_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "BookGuard/1.0 (https://bookguard.app; support@bookguard.app)",
        Accept: "application/json",
      },
      next: { revalidate: 86400 }, // Cache external lookup for 24h
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Open Library Lookup
 */
interface OpenLibraryBook {
  title?: string;
  authors?: Array<{ name?: string }>;
  publishers?: Array<{ name?: string }>;
  publish_date?: string;
  number_of_pages?: number;
  cover?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  subjects?: Array<{ name?: string }>;
  identifiers?: {
    isbn_10?: string[];
    isbn_13?: string[];
  };
  by_statement?: string;
}

async function lookupOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data: Record<string, OpenLibraryBook> = await res.json();
    const key = `ISBN:${isbn}`;
    const item = data[key];

    if (!item || !item.title) {
      return null;
    }

    const authors =
      item.authors?.map((a) => a.name?.trim()).filter((n): n is string => Boolean(n)) || [];

    const publisher = item.publishers?.[0]?.name?.trim() || null;
    const publishedDate = item.publish_date?.trim() || null;

    let publishedYear: number | null = null;
    if (publishedDate) {
      const match = publishedDate.match(/\b(19\d\d|20\d\d)\b/);
      if (match) {
        publishedYear = parseInt(match[1], 10);
      }
    }

    const coverUrl =
      item.cover?.large || item.cover?.medium || item.cover?.small || null;

    const categories =
      item.subjects?.map((s) => s.name?.trim()).filter((s): s is string => Boolean(s)).slice(0, 4) || [];

    const isbn10 = item.identifiers?.isbn_10?.[0] || (isbn.length === 10 ? isbn : null);
    const isbn13 = item.identifiers?.isbn_13?.[0] || (isbn.length === 13 ? isbn : null);

    return {
      title: item.title.trim(),
      authors,
      publisher,
      publishedDate,
      publishedYear,
      edition: null,
      isbn10,
      isbn13,
      coverUrl: coverUrl ? coverUrl.replace("http://", "https://") : null,
      pageCount: item.number_of_pages || null,
      categories,
      description: null,
      source: "openlibrary",
    };
  } catch (err) {
    console.warn("Open Library lookup failed or timed out:", err);
    return null;
  }
}

/**
 * Google Books Fallback Lookup
 */
interface GoogleBooksResponse {
  totalItems?: number;
  items?: Array<{
    volumeInfo?: {
      title?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      description?: string;
      pageCount?: number;
      categories?: string[];
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
      industryIdentifiers?: Array<{
        type?: string;
        identifier?: string;
      }>;
      language?: string;
    };
  }>;
}

async function lookupGoogleBooks(isbn: string): Promise<BookMetadata | null> {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${
      apiKey ? `&key=${apiKey}` : ""
    }`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data: GoogleBooksResponse = await res.json();
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const vol = data.items[0].volumeInfo;
    if (!vol || !vol.title) {
      return null;
    }

    let isbn10: string | null = null;
    let isbn13: string | null = null;

    if (vol.industryIdentifiers) {
      for (const id of vol.industryIdentifiers) {
        if (id.type === "ISBN_10") isbn10 = id.identifier || null;
        if (id.type === "ISBN_13") isbn13 = id.identifier || null;
      }
    }
    if (!isbn13 && isbn.length === 13) isbn13 = isbn;
    if (!isbn10 && isbn.length === 10) isbn10 = isbn;

    let publishedYear: number | null = null;
    if (vol.publishedDate) {
      const match = vol.publishedDate.match(/\b(19\d\d|20\d\d)\b/);
      if (match) publishedYear = parseInt(match[1], 10);
    }

    let coverUrl = vol.imageLinks?.thumbnail || vol.imageLinks?.smallThumbnail || null;
    if (coverUrl) {
      coverUrl = coverUrl.replace("http://", "https://");
    }

    return {
      title: vol.title.trim(),
      authors: vol.authors?.map((a) => a.trim()) || [],
      publisher: vol.publisher?.trim() || null,
      publishedDate: vol.publishedDate || null,
      publishedYear,
      edition: null,
      isbn10,
      isbn13,
      coverUrl,
      pageCount: vol.pageCount || null,
      categories: vol.categories?.map((c) => c.trim()) || [],
      description: vol.description?.trim() || null,
      language: vol.language || null,
      source: "googlebooks",
    };
  } catch (err) {
    console.warn("Google Books fallback failed or timed out:", err);
    return null;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<LookupResponse>> {
  const { searchParams } = new URL(request.url);
  const rawIsbn = searchParams.get("isbn");

  if (!rawIsbn) {
    return NextResponse.json(
      { success: false, error: "Query parameter 'isbn' is required" },
      { status: 400 }
    );
  }

  const inspection = inspectISBN(rawIsbn);
  if (!inspection.isValid) {
    return NextResponse.json(
      { success: false, error: inspection.error || "Invalid ISBN provided" },
      { status: 400 }
    );
  }

  const cleanIsbn = inspection.normalized;

  // 1. Try Open Library first
  let metadata = await lookupOpenLibrary(cleanIsbn);

  // 2. Fallback to Google Books if Open Library yielded nothing
  if (!metadata) {
    metadata = await lookupGoogleBooks(cleanIsbn);
  }

  if (!metadata) {
    return NextResponse.json(
      {
        success: false,
        error: "No metadata found for this ISBN in Open Library or Google Books.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    book: metadata,
  });
}
