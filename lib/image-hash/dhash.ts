import { extractGrayscaleMatrix, DHASH_WIDTH, DHASH_HEIGHT } from "./prepare";

/**
 * Computes a 64-bit perceptual difference hash (dHash) from an image.
 * Returns a 16-character lowercase hexadecimal string.
 *
 * Example output: "a4ff03924bc9e102"
 */
export async function computeDHash(
  source: File | Blob | HTMLImageElement | HTMLCanvasElement | string
): Promise<string> {
  const grayscale = await extractGrayscaleMatrix(source);

  let hexResult = "";
  let currentNibble = 0;
  let bitCount = 0;

  for (let y = 0; y < DHASH_HEIGHT; y++) {
    for (let x = 0; x < DHASH_WIDTH - 1; x++) {
      const leftPixel = grayscale[y * DHASH_WIDTH + x];
      const rightPixel = grayscale[y * DHASH_WIDTH + (x + 1)];

      const bit = leftPixel > rightPixel ? 1 : 0;
      currentNibble = (currentNibble << 1) | bit;
      bitCount++;

      if (bitCount % 4 === 0) {
        hexResult += currentNibble.toString(16);
        currentNibble = 0;
      }
    }
  }

  return hexResult.padStart(16, "0").toLowerCase();
}
