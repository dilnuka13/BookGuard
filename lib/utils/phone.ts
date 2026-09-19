import type { PhoneValidationResult } from "@/types/profile";

/**
 * Validates and normalizes phone numbers with specialized support for Sri Lankan mobile formats.
 * Accepts:
 * - 07XXXXXXXX (10 digits, standard local)
 * - +947XXXXXXXX (E.164 with +94)
 * - 947XXXXXXXX (without +)
 * - Standard international formats: +[country_code][number] (8 to 15 digits)
 */
export function validateAndFormatPhone(rawInput: string): PhoneValidationResult {
  const cleaned = rawInput.trim().replace(/[\s\-()]/g, "");

  if (!cleaned) {
    return {
      isValid: false,
      formatted: "",
      normalized: "",
      error: "Phone number is required",
    };
  }

  // 1. Local Sri Lankan mobile (e.g., 0712345678)
  const slLocalRegex = /^0(7[0-9]{8})$/;
  const slLocalMatch = cleaned.match(slLocalRegex);
  if (slLocalMatch) {
    const mobileDigits = slLocalMatch[1]; // 7XXXXXXXX
    const normalized = `+94${mobileDigits}`;
    const formatted = `0${mobileDigits.slice(0, 2)} ${mobileDigits.slice(2, 5)} ${mobileDigits.slice(5)}`;
    return {
      isValid: true,
      formatted,
      normalized,
    };
  }

  // 2. Sri Lankan with +94 (e.g., +94712345678)
  const slIntlPlusRegex = /^\+94(7[0-9]{8})$/;
  const slIntlPlusMatch = cleaned.match(slIntlPlusRegex);
  if (slIntlPlusMatch) {
    const mobileDigits = slIntlPlusMatch[1];
    const normalized = `+94${mobileDigits}`;
    const formatted = `+94 ${mobileDigits.slice(0, 2)} ${mobileDigits.slice(2, 5)} ${mobileDigits.slice(5)}`;
    return {
      isValid: true,
      formatted,
      normalized,
    };
  }

  // 3. Sri Lankan with 94 (without plus, e.g., 94712345678)
  const slIntlNoPlusRegex = /^94(7[0-9]{8})$/;
  const slIntlNoPlusMatch = cleaned.match(slIntlNoPlusRegex);
  if (slIntlNoPlusMatch) {
    const mobileDigits = slIntlNoPlusMatch[1];
    const normalized = `+94${mobileDigits}`;
    const formatted = `+94 ${mobileDigits.slice(0, 2)} ${mobileDigits.slice(2, 5)} ${mobileDigits.slice(5)}`;
    return {
      isValid: true,
      formatted,
      normalized,
    };
  }

  // 4. General International E.164 format (+ followed by 8 to 15 digits)
  const generalIntlRegex = /^\+([1-9][0-9]{7,14})$/;
  if (generalIntlRegex.test(cleaned)) {
    return {
      isValid: true,
      formatted: cleaned,
      normalized: cleaned,
    };
  }

  // Check for common Sri Lankan input mistakes to provide helpful guidance
  if (cleaned.startsWith("07") && cleaned.length !== 10) {
    return {
      isValid: false,
      formatted: cleaned,
      normalized: cleaned,
      error: `Sri Lankan number should have 10 digits (currently ${cleaned.length})`,
    };
  }

  if (cleaned.startsWith("+94") && cleaned.length !== 12) {
    return {
      isValid: false,
      formatted: cleaned,
      normalized: cleaned,
      error: `Sri Lankan number with +94 should have 12 characters (e.g. +94712345678)`,
    };
  }

  return {
    isValid: false,
    formatted: cleaned,
    normalized: cleaned,
    error: "Please enter a valid phone number (e.g. 077 123 4567 or +94 77 123 4567)",
  };
}
