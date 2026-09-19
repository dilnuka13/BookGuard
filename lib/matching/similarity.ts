/**
 * String and semantic similarity algorithms for BookGuard duplicate matching.
 * Safe for Sinhala, Tamil, English, and numeric edition comparisons.
 */

/**
 * Standard Levenshtein edit distance calculation.
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Swap to use less memory
  const a = m < n ? s1 : s2;
  const b = m < n ? s2 : s1;

  let prev = Array.from({ length: a.length + 1 }, (_, i) => i);
  let curr = new Array(a.length + 1);

  for (let j = 1; j <= b.length; j++) {
    curr[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(curr[i - 1] + 1, prev[i] + 1, prev[i - 1] + cost);
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }

  return prev[a.length];
}

/**
 * Calculates Levenshtein similarity ratio between 0.0 and 1.0.
 */
export function levenshteinSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Token Jaccard similarity (word set overlap).
 */
export function tokenJaccardSimilarity(s1: string, s2: string): number {
  const tokens1 = new Set(
    s1
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1)
  );
  const tokens2 = new Set(
    s2
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1)
  );

  if (tokens1.size === 0 && tokens2.size === 0) return 1.0;
  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersection++;
    }
  }

  const union = tokens1.size + tokens2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Composite string similarity combining token overlap and character-level edit distance.
 * Performs well on title typos, OCR noise, and subtitle rearrangements.
 */
export function calculateStringSimilarity(strA?: string | null, strB?: string | null): number {
  if (!strA || !strB) return 0.0;

  const a = strA
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const b = strB
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (a === b) return 1.0;

  const levScore = levenshteinSimilarity(a, b);
  const jaccardScore = tokenJaccardSimilarity(a, b);

  // Weighted combination
  const combined = jaccardScore * 0.55 + levScore * 0.45;
  return Number(combined.toFixed(4));
}

/**
 * Detects whether two books share the same title/author but conflict in edition or publication era.
 */
export function detectEditionConflict(
  editionA?: string | null,
  editionB?: string | null,
  yearA?: number | null,
  yearB?: number | null
): boolean {
  // Check edition strings if both are present
  if (editionA && editionB) {
    const a = editionA.trim().toLowerCase();
    const b = editionB.trim().toLowerCase();
    if (a !== b) {
      // Different editions indicated
      return true;
    }
  }

  // Check publication years if both are present
  if (yearA && yearB) {
    // If published years differ by 2 or more years, likely a revised edition / reprint
    if (Math.abs(yearA - yearB) >= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether words from a candidate title or author are present in OCR text.
 */
export function calculateOcrOverlap(
  ocrText?: string | null,
  targetTitle?: string | null,
  targetAuthor?: string | null
): number {
  if (!ocrText || !targetTitle) return 0.0;

  const ocrLower = ocrText.normalize("NFKC").toLowerCase();
  const titleTokens = targetTitle
    .normalize("NFKC")
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (titleTokens.length === 0) return 0.0;

  let matchedTitleTokens = 0;
  for (const token of titleTokens) {
    if (ocrLower.includes(token)) {
      matchedTitleTokens++;
    }
  }

  let score = matchedTitleTokens / titleTokens.length;

  if (targetAuthor) {
    const authorTokens = targetAuthor
      .normalize("NFKC")
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (authorTokens.length > 0) {
      let matchedAuthorTokens = 0;
      for (const token of authorTokens) {
        if (ocrLower.includes(token)) {
          matchedAuthorTokens++;
        }
      }
      const authorScore = matchedAuthorTokens / authorTokens.length;
      score = score * 0.7 + authorScore * 0.3;
    }
  }

  return Number(score.toFixed(4));
}
