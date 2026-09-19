/**
 * Compares two 64-bit hexadecimal perceptual hashes using Hamming distance.
 */

const NIBBLE_LOOKUP: Record<string, number> = {
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "a": 10, "b": 11, "c": 12, "d": 13, "e": 14, "f": 15,
};

function countBitDifferences(n1: number, n2: number): number {
  let xor = (n1 ^ n2) & 0xf;
  let count = 0;
  while (xor > 0) {
    count += xor & 1;
    xor >>= 1;
  }
  return count;
}

/**
 * Calculates the Hamming distance (0 to 64) between two 16-char hex hashes.
 */
export function calculateHammingDistance(hashA?: string | null, hashB?: string | null): number {
  if (!hashA || !hashB) return 64;

  const a = hashA.trim().toLowerCase();
  const b = hashB.trim().toLowerCase();

  if (a.length !== 16 || b.length !== 16) {
    return 64;
  }

  let distance = 0;
  for (let i = 0; i < 16; i++) {
    const valA = NIBBLE_LOOKUP[a[i]] ?? 0;
    const valB = NIBBLE_LOOKUP[b[i]] ?? 0;
    distance += countBitDifferences(valA, valB);
  }

  return distance;
}

/**
 * Calculates a normalized similarity score (0.0 to 1.0).
 * 1.0 means identical visual fingerprints.
 * >= 0.85 means high visual resemblance (identical cover art with possible crop/lighting differences).
 */
export function calculateHashSimilarity(hashA?: string | null, hashB?: string | null): number {
  if (!hashA || !hashB) return 0.0;

  const distance = calculateHammingDistance(hashA, hashB);
  const similarity = Math.max(0, (64 - distance) / 64);

  return Number(similarity.toFixed(4));
}
