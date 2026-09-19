/**
 * Next-Level ISBN Intelligence & Registration Group Tracker.
 * Resolves international registration groups, structural deconstruction,
 * checksum arithmetic, and country agencies (with special support for Sri Lankan 955 ISBNs).
 */

import { normalizeISBN } from "./normalize";
import { validateISBN10, validateISBN13, convertISBN10To13, formatISBN } from "./validate";

export interface RegistrationGroupInfo {
  code: string;
  name: string;
  flag: string;
  agency: string;
  region: string;
}

/**
 * International ISBN Registration Groups database.
 */
export const ISBN_REGISTRATION_GROUPS: Record<string, RegistrationGroupInfo> = {
  "955": {
    code: "955",
    name: "Sri Lanka",
    flag: "🇱🇰",
    agency: "National Library & Documentation Services Board (NLDSB)",
    region: "South Asia",
  },
  "0": {
    code: "0",
    name: "English (US / UK / International)",
    flag: "🌐",
    agency: "Bowker / Nielsen Book Services",
    region: "International",
  },
  "1": {
    code: "1",
    name: "English (US / UK / Canada / Australia)",
    flag: "🇬🇧",
    agency: "Bowker / Nielsen Book Services",
    region: "International",
  },
  "2": {
    code: "2",
    name: "French Language Area",
    flag: "🇫🇷",
    agency: "AFNIL (France / Belgium / Switzerland)",
    region: "Europe",
  },
  "3": {
    code: "3",
    name: "German Language Area",
    flag: "🇩🇪",
    agency: "MVB Marketing- und Verlagsservice (DE / AT / CH)",
    region: "Europe",
  },
  "4": {
    code: "4",
    name: "Japan",
    flag: "🇯🇵",
    agency: "Japan ISBN Agency",
    region: "East Asia",
  },
  "5": {
    code: "5",
    name: "Russia & CIS Area",
    flag: "🇷🇺",
    agency: "Russian Book Chamber",
    region: "Eurasia",
  },
  "7": {
    code: "7",
    name: "China",
    flag: "🇨🇳",
    agency: "ISBN Center of China",
    region: "East Asia",
  },
  "81": {
    code: "81",
    name: "India",
    flag: "🇮🇳",
    agency: "Raja Rammohun Roy National Agency for ISBN",
    region: "South Asia",
  },
  "93": {
    code: "93",
    name: "India",
    flag: "🇮🇳",
    agency: "Raja Rammohun Roy National Agency for ISBN",
    region: "South Asia",
  },
  "82": {
    code: "82",
    name: "Norway",
    flag: "🇳🇴",
    agency: "National Library of Norway",
    region: "Europe",
  },
  "84": {
    code: "84",
    name: "Spain",
    flag: "🇪🇸",
    agency: "Agencia del ISBN",
    region: "Europe",
  },
  "85": {
    code: "85",
    name: "Brazil",
    flag: "🇧🇷",
    agency: "CBL - Câmara Brasileira do Livro",
    region: "South America",
  },
  "88": {
    code: "88",
    name: "Italy",
    flag: "🇮🇹",
    agency: "EDISER srl",
    region: "Europe",
  },
  "960": {
    code: "960",
    name: "Greece",
    flag: "🇬🇷",
    agency: "Greek National Library",
    region: "Europe",
  },
  "962": {
    code: "962",
    name: "Hong Kong",
    flag: "🇭🇰",
    agency: "Books Registration Office",
    region: "East Asia",
  },
  "967": {
    code: "967",
    name: "Malaysia",
    flag: "🇲🇾",
    agency: "National Library of Malaysia",
    region: "Southeast Asia",
  },
  "974": {
    code: "974",
    name: "Thailand",
    flag: "🇹🇭",
    agency: "National Library of Thailand",
    region: "Southeast Asia",
  },
  "981": {
    code: "981",
    name: "Singapore",
    flag: "🇸🇬",
    agency: "National Library Board",
    region: "Southeast Asia",
  },
  "984": {
    code: "984",
    name: "Bangladesh",
    flag: "🇧🇩",
    agency: "National Library of Bangladesh",
    region: "South Asia",
  },
};

export interface ChecksumCalculationStep {
  digit: number;
  weight: number;
  product: number;
}

export interface ISBNTrackingAnalysis {
  raw: string;
  normalized: string;
  isValid: boolean;
  type: "ISBN-10" | "ISBN-13" | "INVALID";
  formatted: string;
  isbn10?: string | null;
  isbn13?: string | null;
  group?: RegistrationGroupInfo;
  isSriLankan: boolean;
  segments: {
    prefix?: string;
    groupCode?: string;
    body?: string;
    checkDigit?: string;
  };
  checksum: {
    sum: number;
    expected: string;
    actual: string;
    formula: string;
    steps: ChecksumCalculationStep[];
  };
}

/**
 * Resolves the Registration Group Info from an ISBN-13 or ISBN-10.
 */
export function resolveRegistrationGroup(normalized: string): {
  group: RegistrationGroupInfo | null;
  groupCode: string | null;
} {
  let body = normalized;
  if (body.length === 13) {
    body = body.slice(3); // remove 978 or 979 prefix
  }

  // Try matching group codes of length 3, 2, or 1
  const candidates = [body.slice(0, 3), body.slice(0, 2), body.slice(0, 1)];
  for (const code of candidates) {
    if (ISBN_REGISTRATION_GROUPS[code]) {
      return { group: ISBN_REGISTRATION_GROUPS[code], groupCode: code };
    }
  }

  return { group: null, groupCode: candidates[0] || null };
}

/**
 * Deep structural analysis and tracking breakdown of any ISBN.
 */
export function trackISBN(input: string): ISBNTrackingAnalysis {
  const clean = normalizeISBN(input);
  const isValid13 = clean.length === 13 && validateISBN13(clean);
  const isValid10 = clean.length === 10 && validateISBN10(clean);
  const isValid = isValid13 || isValid10;

  const type = isValid13 ? "ISBN-13" : isValid10 ? "ISBN-10" : "INVALID";
  const { group, groupCode } = resolveRegistrationGroup(clean);
  const isSriLankan = groupCode === "955";

  let isbn13: string | null = null;
  let isbn10: string | null = null;

  if (isValid13) {
    isbn13 = clean;
    // Attempt 10 conversion if 978
    if (clean.startsWith("978")) {
      const core = clean.slice(3, 12);
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(core[i], 10) * (10 - i);
      }
      const rem = (11 - (sum % 11)) % 11;
      isbn10 = core + (rem === 10 ? "X" : rem.toString());
    }
  } else if (isValid10) {
    isbn10 = clean;
    isbn13 = convertISBN10To13(clean);
  }

  // Checksum calculation details
  const steps: ChecksumCalculationStep[] = [];
  let sum = 0;
  let expectedCheckDigit = "";
  let formula = "";

  if (clean.length === 13) {
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(clean[i], 10) || 0;
      const weight = i % 2 === 0 ? 1 : 3;
      const product = digit * weight;
      sum += product;
      steps.push({ digit, weight, product });
    }
    const rem = (10 - (sum % 10)) % 10;
    expectedCheckDigit = rem.toString();
    formula = `(10 - (${sum} mod 10)) mod 10 = ${expectedCheckDigit}`;
  } else if (clean.length === 10) {
    for (let i = 0; i < 9; i++) {
      const digit = parseInt(clean[i], 10) || 0;
      const weight = 10 - i;
      const product = digit * weight;
      sum += product;
      steps.push({ digit, weight, product });
    }
    const rem = (11 - (sum % 11)) % 11;
    expectedCheckDigit = rem === 10 ? "X" : rem.toString();
    formula = `(11 - (${sum} mod 11)) mod 11 = ${expectedCheckDigit}`;
  }

  const actualCheckDigit = clean ? clean[clean.length - 1] : "";

  return {
    raw: input,
    normalized: clean,
    isValid,
    type,
    formatted: formatISBN(clean),
    isbn10,
    isbn13,
    group: group || undefined,
    isSriLankan,
    segments: {
      prefix: clean.length === 13 ? clean.slice(0, 3) : undefined,
      groupCode: groupCode || undefined,
      body: clean.length === 13 ? clean.slice(3, -1) : clean.slice(0, -1),
      checkDigit: actualCheckDigit,
    },
    checksum: {
      sum,
      expected: expectedCheckDigit,
      actual: actualCheckDigit,
      formula,
      steps,
    },
  };
}
