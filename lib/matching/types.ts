import type { LibraryItem } from "@/types/library";

export type MatchResultType = "OWNED" | "POSSIBLE_DUPLICATE" | "NEW" | "UNKNOWN";

export interface MatchEvidence {
  isbnExact: boolean;
  titleScore: number;
  authorScore: number;
  coverScore?: number;
  ocrScore?: number;
  editionConflict: boolean;
  reasons: string[];
}

export type MatchCandidate = Pick<
  LibraryItem,
  | "id"
  | "book_code"
  | "title"
  | "normalized_title"
  | "author"
  | "normalized_author"
  | "isbn10"
  | "isbn13"
  | "barcode"
  | "edition"
  | "publisher"
  | "published_year"
  | "cover_url"
  | "cover_hash"
  | "ocr_text"
  | "quantity"
>;

export interface MatchResult {
  result: MatchResultType;
  confidence: number;
  matchedBook?: MatchCandidate;
  evidence: MatchEvidence;
  scannedData: {
    isbn?: string | null;
    title?: string | null;
    author?: string | null;
    publisher?: string | null;
    edition?: string | null;
    publishedYear?: number | null;
    coverUrl?: string | null;
    coverHash?: string | null;
    ocrText?: string | null;
  };
}
