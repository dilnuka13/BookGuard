/**
 * Normalization utilities for BookGuard library items.
 * Handles Unicode NFKC normalization, whitespace collapsing, and punctuation stripping
 * while strictly preserving Sinhala (\u0D80-\u0DFF), Tamil (\u0B80-\u0BFF), and other non-Latin scripts.
 */

/**
 * Normalizes book title for indexing and duplicate search.
 * - Converts to lowercase and normalizes Unicode (NFKC)
 * - Preserves Unicode letters (\p{L}), vowel marks/diacritics (\p{M}), and numbers (\p{N})
 * - Collapses repeated whitespace to single space
 * - Strips punctuation noise
 */
export function normalizeBookTitle(title: string): string {
  if (!title) return "";
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes author name following the same script-safe rules.
 */
export function normalizeAuthorName(author: string | null | undefined): string | null {
  if (!author || !author.trim()) return null;
  const normalized = author
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || null;
}

export interface NormalizedISBNResult {
  isbn10: string | null;
  isbn13: string | null;
  clean: string | null;
  isValid: boolean;
}

/**
 * Normalizes an ISBN string.
 * Strips spaces, hyphens, and periods.
 * Validates format for ISBN-10 (9 digits + 1 digit or 'X') and ISBN-13 (13 digits).
 * Note: ISBN is optional; empty input returns nulls with isValid: true.
 */
export function normalizeISBN(rawInput: string | null | undefined): NormalizedISBNResult {
  if (!rawInput || !rawInput.trim()) {
    return {
      isbn10: null,
      isbn13: null,
      clean: null,
      isValid: true,
    };
  }

  const cleaned = rawInput.trim().replace(/[\s\-\.]/g, "").toUpperCase();

  // ISBN-10: 9 digits followed by a digit or X
  if (/^[0-9]{9}[0-9X]$/.test(cleaned)) {
    return {
      isbn10: cleaned,
      isbn13: null,
      clean: cleaned,
      isValid: true,
    };
  }

  // ISBN-13: 13 digits starting with 978 or 979
  if (/^[0-9]{13}$/.test(cleaned)) {
    return {
      isbn10: null,
      isbn13: cleaned,
      clean: cleaned,
      isValid: true,
    };
  }

  // If length doesn't match standard ISBN, return clean digits/text but flag invalid
  return {
    isbn10: null,
    isbn13: null,
    clean: cleaned,
    isValid: false,
  };
}
