/**
 * Centralized threshold constants for BookGuard's smart duplicate matching engine.
 * Never scatter magic numbers across components.
 */

export const MATCH_THRESHOLDS = {
  // ISBN Confidence
  EXACT_ISBN_CONFIDENCE: 1.0,

  // Title Similarity
  TITLE_IDENTICAL: 0.95,
  TITLE_HIGH_SIMILARITY: 0.85,
  TITLE_MODERATE_SIMILARITY: 0.70,

  // Author Similarity
  AUTHOR_IDENTICAL: 0.95,
  AUTHOR_HIGH_SIMILARITY: 0.80,
  AUTHOR_MODERATE_SIMILARITY: 0.65,

  // Cover Hash (dHash) Similarity
  COVER_IDENTICAL: 0.94, // <= 4 bits distance
  COVER_HIGH_SIMILARITY: 0.85, // <= 10 bits distance
  COVER_MODERATE_SIMILARITY: 0.75, // <= 16 bits distance

  // OCR Text Agreement
  OCR_HIGH_AGREEMENT: 0.75,
  OCR_MODERATE_AGREEMENT: 0.55,

  // Confidence Scores for Classifications
  CONFIDENCE_OWNED_EXACT_ISBN: 1.0,
  CONFIDENCE_OWNED_TITLE_AUTHOR: 0.95,
  CONFIDENCE_DUPLICATE_EDITION_CONFLICT: 0.92,
  CONFIDENCE_DUPLICATE_STRONG_TITLE: 0.85,
  CONFIDENCE_DUPLICATE_STRONG_COVER: 0.82,
  CONFIDENCE_NEW_BOOK: 0.90,
} as const;
