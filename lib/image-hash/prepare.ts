/**
 * Prepares an image for perceptual difference hashing (dHash).
 * Resizes the image to 9 columns x 8 rows in grayscale.
 */

export const DHASH_WIDTH = 9;
export const DHASH_HEIGHT = 8;

export async function loadImageSource(
  source: File | Blob | HTMLImageElement | HTMLCanvasElement | string
): Promise<HTMLImageElement> {
  if (typeof source === "string") {
    const img = new Image();
    img.crossOrigin = "anonymous";
    return new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image source for hashing"));
      img.src = source;
    });
  }

  if (source instanceof HTMLImageElement) {
    if (source.complete && source.naturalWidth > 0) {
      return source;
    }
    return new Promise((resolve, reject) => {
      source.onload = () => resolve(source);
      source.onerror = () => reject(new Error("Failed to load HTMLImageElement"));
    });
  }

  const img = new Image();
  img.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image source for hashing"));

    if (source instanceof HTMLCanvasElement) {
      img.src = source.toDataURL("image/jpeg", 0.85);
    } else if (source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else {
      reject(new Error("Unsupported image source type"));
    }
  });
}

/**
 * Extracts 72 grayscale luminance values (9 columns x 8 rows) from an image.
 */
export async function extractGrayscaleMatrix(
  source: File | Blob | HTMLImageElement | HTMLCanvasElement | string
): Promise<Uint8Array> {
  const img = await loadImageSource(source);

  const canvas = document.createElement("canvas");
  canvas.width = DHASH_WIDTH;
  canvas.height = DHASH_HEIGHT;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Unable to create canvas 2D context for dHash");
  }

  // Draw scaled down image
  ctx.drawImage(img, 0, 0, DHASH_WIDTH, DHASH_HEIGHT);

  const imageData = ctx.getImageData(0, 0, DHASH_WIDTH, DHASH_HEIGHT);
  const data = imageData.data;
  const grayscale = new Uint8Array(DHASH_WIDTH * DHASH_HEIGHT);

  for (let i = 0; i < grayscale.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Standard Rec. 601 luma formula
    grayscale[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // Revoke blob URL if created from File/Blob
  if (img.src.startsWith("blob:")) {
    URL.revokeObjectURL(img.src);
  }

  return grayscale;
}
