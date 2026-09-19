/**
 * Normalizes OCR text extracted from book covers.
 * Preserves English words, digits, Sinhala and Tamil characters with vowel signs.
 */

export function normalizeOcrText(rawText: string): string {
  if (!rawText) return "";

  return rawText
    .normalize("NFKC")
    .replace(/[^\p{L}\p{M}\p{N}\s\-.,:;'"()\/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface OcrExtractedCandidates {
  titleCandidate?: string;
  authorCandidate?: string;
  lines: string[];
}

/**
 * Heuristically extracts prominent title and author candidates from OCR lines.
 * Usually the largest/top lines are book titles, and lines starting with 'by' or near the bottom
 * indicate author names.
 */
export function extractCandidatesFromOcr(rawText: string): OcrExtractedCandidates {
  const normalized = rawText.normalize("NFKC");
  const rawLines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 2);

  // Clean lines
  const cleanLines = rawLines
    .map((line) => line.replace(/[^\p{L}\p{M}\p{N}\s\-]/gu, " ").replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 2);

  if (cleanLines.length === 0) {
    return { lines: [] };
  }

  let titleCandidate: string | undefined = undefined;
  let authorCandidate: string | undefined = undefined;

  // Check for lines with explicit author markers ("by ...", "රචනය ...", "කර්තෘ ...")
  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const lower = line.toLowerCase();

    if (
      lower.startsWith("by ") ||
      lower.startsWith("by:") ||
      line.startsWith("රචනය") ||
      line.startsWith("කර්තෘ") ||
      line.startsWith("ලියන්නේ")
    ) {
      authorCandidate = line
        .replace(/^(by:?|රචනය:?|කර්තෘ:?|ලියන්නේ:?)\s*/i, "")
        .trim();
      break;
    }
  }

  // The first significant non-author line is typically the title
  for (const line of cleanLines) {
    if (line !== authorCandidate && line.length >= 3) {
      titleCandidate = line;
      break;
    }
  }

  return {
    titleCandidate,
    authorCandidate,
    lines: cleanLines,
  };
}
