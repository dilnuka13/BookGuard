import { normalizeISBN } from "./normalize";
import type { ISBNValidationResult } from "./types";

/**
 * Validates a 10-digit ISBN using modulo 11 checksum.
 */
export function validateISBN10(input: string): boolean {
  const clean = normalizeISBN(input);
  if (!/^[0-9]{9}[0-9X]$/.test(clean)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i);
  }

  const checkChar = clean[9];
  const checkValue = checkChar === "X" ? 10 : parseInt(checkChar, 10);
  sum += checkValue;

  return sum % 11 === 0;
}

/**
 * Validates a 13-digit ISBN using alternating (1, 3) weights modulo 10 checksum.
 */
export function validateISBN13(input: string): boolean {
  const clean = normalizeISBN(input);
  if (!/^[0-9]{13}$/.test(clean)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(clean[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  const actualCheckDigit = parseInt(clean[12], 10);

  return expectedCheckDigit === actualCheckDigit;
}

/**
 * Checks if a scanned barcode is specifically an international book barcode.
 * Book barcodes typically start with GS1 prefixes 978 or 979 and have valid ISBN-13 checksums.
 */
export function isBookBarcode(barcode: string): boolean {
  const clean = normalizeISBN(barcode);
  if (!clean.startsWith("978") && !clean.startsWith("979")) {
    return false;
  }

  return validateISBN13(clean);
}

/**
 * Converts a valid ISBN-10 to an ISBN-13 (prefixed with 978).
 */
export function convertISBN10To13(isbn10: string): string | null {
  if (!validateISBN10(isbn10)) {
    return null;
  }

  const clean = normalizeISBN(isbn10);
  const core = "978" + clean.slice(0, 9);

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(core[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return core + checkDigit.toString();
}

/**
 * Formats an ISBN-13 with standard hyphens (e.g. 978-0-14-032872-1).
 */
export function formatISBN(isbn: string): string {
  const clean = normalizeISBN(isbn);
  if (clean.length === 13) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 4)}-${clean.slice(4, 7)}-${clean.slice(7, 12)}-${clean.slice(12)}`;
  }
  if (clean.length === 10) {
    return `${clean.slice(0, 1)}-${clean.slice(1, 4)}-${clean.slice(4, 9)}-${clean.slice(9)}`;
  }
  return clean;
}

/**
 * Inspects, normalizes, and validates any candidate ISBN string.
 */
export function inspectISBN(input: string): ISBNValidationResult {
  const normalized = normalizeISBN(input);

  if (!normalized) {
    return {
      isValid: false,
      type: "INVALID",
      normalized: "",
      error: "ISBN cannot be empty",
    };
  }

  if (normalized.length === 13) {
    const isValid = validateISBN13(normalized);
    return {
      isValid,
      type: isValid ? "ISBN-13" : "INVALID",
      normalized,
      formatted: isValid ? formatISBN(normalized) : undefined,
      error: isValid ? undefined : "Invalid ISBN-13 checksum",
    };
  }

  if (normalized.length === 10) {
    const isValid = validateISBN10(normalized);
    return {
      isValid,
      type: isValid ? "ISBN-10" : "INVALID",
      normalized,
      formatted: isValid ? formatISBN(normalized) : undefined,
      error: isValid ? undefined : "Invalid ISBN-10 checksum",
    };
  }

  return {
    isValid: false,
    type: "INVALID",
    normalized,
    error: "ISBN must be 10 or 13 characters long",
  };
}
