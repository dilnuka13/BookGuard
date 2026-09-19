import type { MatchCandidate, MatchResult, MatchEvidence } from "./types";
import { MATCH_THRESHOLDS } from "./thresholds";
import {
  calculateStringSimilarity,
  detectEditionConflict,
  calculateOcrOverlap,
} from "./similarity";
import { calculateHashSimilarity } from "../image-hash/compare";
import { normalizeISBN } from "../isbn/normalize";

export interface ScannedBookInput {
  isbn?: string | null;
  title?: string | null;
  author?: string | null;
  publisher?: string | null;
  edition?: string | null;
  publishedYear?: number | null;
  coverUrl?: string | null;
  coverHash?: string | null;
  ocrText?: string | null;
}

/**
 * Smart Multi-Modal Book Duplicate Matching Engine.
 * Evaluates ISBN, Title, Author, Edition, Cover Fingerprint (dHash), and OCR text.
 * Never produces false OWNED claims based on visual similarity alone.
 */
export function matchBook(
  scanned: ScannedBookInput,
  candidates: MatchCandidate[]
): MatchResult {
  const normalizedScannedIsbn = normalizeISBN(scanned.isbn);

  // --------------------------------------------------------------------------
  // 1. EXACT ISBN MATCH (Highest priority & confidence)
  // --------------------------------------------------------------------------
  if (normalizedScannedIsbn) {
    const exactMatch = candidates.find((c) => {
      const c13 = normalizeISBN(c.isbn13);
      const c10 = normalizeISBN(c.isbn10);
      const cBarcode = normalizeISBN(c.barcode);
      return (
        c13 === normalizedScannedIsbn ||
        c10 === normalizedScannedIsbn ||
        cBarcode === normalizedScannedIsbn
      );
    });

    if (exactMatch) {
      return {
        result: "OWNED",
        confidence: MATCH_THRESHOLDS.CONFIDENCE_OWNED_EXACT_ISBN,
        matchedBook: exactMatch,
        evidence: {
          isbnExact: true,
          titleScore: 1.0,
          authorScore: 1.0,
          editionConflict: false,
          reasons: ["Exact ISBN match in your personal library."],
        },
        scannedData: scanned,
      };
    }
  }

  // If no candidates exist in the user's library at all:
  if (candidates.length === 0) {
    return {
      result: "NEW",
      confidence: MATCH_THRESHOLDS.CONFIDENCE_NEW_BOOK,
      evidence: {
        isbnExact: false,
        titleScore: 0.0,
        authorScore: 0.0,
        editionConflict: false,
        reasons: ["Your library is currently empty. This is a new book."],
      },
      scannedData: scanned,
    };
  }

  // --------------------------------------------------------------------------
  // 2. MULTI-SIGNAL CANDIDATE SCORING
  // --------------------------------------------------------------------------
  let bestCandidate: MatchCandidate | undefined = undefined;
  let bestEvidence: MatchEvidence = {
    isbnExact: false,
    titleScore: 0,
    authorScore: 0,
    editionConflict: false,
    reasons: [],
  };
  let highestCompositeScore = 0;

  for (const candidate of candidates) {
    const reasons: string[] = [];

    // Title score
    const titleScore = scanned.title
      ? calculateStringSimilarity(scanned.title, candidate.title)
      : candidate.ocr_text && scanned.ocrText
      ? calculateStringSimilarity(scanned.ocrText, candidate.ocr_text)
      : 0;

    // Author score
    const authorScore =
      scanned.author && candidate.author
        ? calculateStringSimilarity(scanned.author, candidate.author)
        : scanned.author || candidate.author
        ? 0.5 // Neutral if one side has author and the other doesn't
        : 1.0; // Both have no author, treat neutral/compatible

    // Cover hash similarity (dHash)
    let coverScore: number | undefined = undefined;
    if (scanned.coverHash && candidate.cover_hash) {
      coverScore = calculateHashSimilarity(scanned.coverHash, candidate.cover_hash);
    }

    // OCR overlap score
    let ocrScore: number | undefined = undefined;
    if (scanned.ocrText) {
      ocrScore = calculateOcrOverlap(scanned.ocrText, candidate.title, candidate.author);
    }

    // Edition conflict check
    const editionConflict = detectEditionConflict(
      scanned.edition,
      candidate.edition,
      scanned.publishedYear,
      candidate.published_year
    );

    // Composite score computation
    // Primary weight on title and author; secondary on cover hash and OCR
    let composite = titleScore * 0.5 + authorScore * 0.3;
    if (coverScore !== undefined) {
      composite = composite * 0.75 + coverScore * 0.25;
    }
    if (ocrScore !== undefined && !scanned.title) {
      // If title wasn't known from metadata, OCR takes primary weight
      composite = Math.max(composite, ocrScore * 0.7 + (coverScore ?? 0) * 0.3);
    }

    if (composite > highestCompositeScore) {
      highestCompositeScore = composite;
      bestCandidate = candidate;

      if (titleScore >= MATCH_THRESHOLDS.TITLE_HIGH_SIMILARITY) {
        reasons.push(`Title matches (${Math.round(titleScore * 100)}% similarity)`);
      }
      if (authorScore >= MATCH_THRESHOLDS.AUTHOR_HIGH_SIMILARITY) {
        reasons.push(`Author matches (${Math.round(authorScore * 100)}% similarity)`);
      }
      if (coverScore !== undefined && coverScore >= MATCH_THRESHOLDS.COVER_HIGH_SIMILARITY) {
        reasons.push(`Cover art matches (${Math.round(coverScore * 100)}% visual similarity)`);
      }
      if (editionConflict) {
        reasons.push("Different edition or publication year detected");
      }

      bestEvidence = {
        isbnExact: false,
        titleScore,
        authorScore,
        coverScore,
        ocrScore,
        editionConflict,
        reasons,
      };
    }
  }

  // --------------------------------------------------------------------------
  // 3. DECISION CLASSIFICATION
  // --------------------------------------------------------------------------

  // Check if we have usable inputs
  if (!scanned.title && !scanned.isbn && !scanned.coverHash && !scanned.ocrText) {
    return {
      result: "UNKNOWN",
      confidence: 0,
      evidence: {
        isbnExact: false,
        titleScore: 0,
        authorScore: 0,
        editionConflict: false,
        reasons: ["Scan was inconclusive. Please retry or enter ISBN manually."],
      },
      scannedData: scanned,
    };
  }

  // Rule A: High Title + High Author
  if (
    bestEvidence.titleScore >= MATCH_THRESHOLDS.TITLE_HIGH_SIMILARITY &&
    bestEvidence.authorScore >= MATCH_THRESHOLDS.AUTHOR_HIGH_SIMILARITY
  ) {
    if (bestEvidence.editionConflict) {
      return {
        result: "POSSIBLE_DUPLICATE",
        confidence: MATCH_THRESHOLDS.CONFIDENCE_DUPLICATE_EDITION_CONFLICT,
        matchedBook: bestCandidate,
        evidence: bestEvidence,
        scannedData: scanned,
      };
    }

    return {
      result: "OWNED",
      confidence: MATCH_THRESHOLDS.CONFIDENCE_OWNED_TITLE_AUTHOR,
      matchedBook: bestCandidate,
      evidence: bestEvidence,
      scannedData: scanned,
    };
  }

  // Rule B: High Title match alone without strong author
  if (bestEvidence.titleScore >= MATCH_THRESHOLDS.TITLE_HIGH_SIMILARITY) {
    return {
      result: "POSSIBLE_DUPLICATE",
      confidence: MATCH_THRESHOLDS.CONFIDENCE_DUPLICATE_STRONG_TITLE,
      matchedBook: bestCandidate,
      evidence: bestEvidence,
      scannedData: scanned,
    };
  }

  // Rule C: High Cover Similarity
  if (
    bestEvidence.coverScore !== undefined &&
    bestEvidence.coverScore >= MATCH_THRESHOLDS.COVER_HIGH_SIMILARITY
  ) {
    // If OCR also agrees on title:
    if (
      bestEvidence.ocrScore !== undefined &&
      bestEvidence.ocrScore >= MATCH_THRESHOLDS.OCR_HIGH_AGREEMENT
    ) {
      if (bestEvidence.editionConflict) {
        return {
          result: "POSSIBLE_DUPLICATE",
          confidence: 0.88,
          matchedBook: bestCandidate,
          evidence: bestEvidence,
          scannedData: scanned,
        };
      }
      return {
        result: "OWNED",
        confidence: 0.90,
        matchedBook: bestCandidate,
        evidence: bestEvidence,
        scannedData: scanned,
      };
    }

    // Cover similarity alone -> ALWAYS POSSIBLE_DUPLICATE, NEVER FALSE OWNED
    return {
      result: "POSSIBLE_DUPLICATE",
      confidence: MATCH_THRESHOLDS.CONFIDENCE_DUPLICATE_STRONG_COVER,
      matchedBook: bestCandidate,
      evidence: bestEvidence,
      scannedData: scanned,
    };
  }

  // Rule D: Moderate Title match
  if (bestEvidence.titleScore >= MATCH_THRESHOLDS.TITLE_MODERATE_SIMILARITY) {
    return {
      result: "POSSIBLE_DUPLICATE",
      confidence: 0.70,
      matchedBook: bestCandidate,
      evidence: bestEvidence,
      scannedData: scanned,
    };
  }

  // Rule E: No significant matches -> NEW BOOK
  return {
    result: "NEW",
    confidence: MATCH_THRESHOLDS.CONFIDENCE_NEW_BOOK,
    evidence: {
      isbnExact: false,
      titleScore: bestEvidence.titleScore,
      authorScore: bestEvidence.authorScore,
      coverScore: bestEvidence.coverScore,
      ocrScore: bestEvidence.ocrScore,
      editionConflict: false,
      reasons: ["No matching book found in your personal collection."],
    },
    scannedData: scanned,
  };
}
