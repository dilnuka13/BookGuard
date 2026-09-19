/**
 * Type definitions for ISBN validation and metadata lookup.
 */

export type ISBNType = "ISBN-10" | "ISBN-13" | "INVALID";

export interface ISBNValidationResult {
  isValid: boolean;
  type: ISBNType;
  normalized: string;
  formatted?: string;
  error?: string;
}

export interface BookMetadata {
  title: string;
  authors: string[];
  publisher?: string | null;
  publishedDate?: string | null;
  publishedYear?: number | null;
  edition?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  coverUrl?: string | null;
  pageCount?: number | null;
  categories?: string[];
  description?: string | null;
  language?: string | null;
  source: "openlibrary" | "googlebooks" | "manual" | "ocr";
}

export interface LookupResponse {
  success: boolean;
  book?: BookMetadata;
  error?: string;
}
