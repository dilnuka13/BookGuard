/**
 * Normalizes an ISBN string by stripping whitespace and hyphens,
 * converting terminal 'x' to uppercase 'X'.
 */
export function normalizeISBN(input?: string | null): string {
  if (!input) return "";

  // Remove spaces, hyphens, and any other non-alphanumeric separators
  const cleaned = input.trim().replace(/[-\s._]/g, "").toUpperCase();

  return cleaned;
}
