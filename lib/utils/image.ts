/**
 * Client-side image validation and compression utilities.
 * Handles user avatars (square cropped) and book covers (aspect-ratio preserved).
 */

export const MAX_AVATAR_INPUT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_COVER_INPUT_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB for high-res camera captures
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function validateAvatarFile(file: File): { isValid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "Please select a valid image file (JPEG, PNG, or WebP).",
    };
  }

  if (file.size > MAX_AVATAR_INPUT_SIZE_BYTES) {
    return {
      isValid: false,
      error: "Image size must be smaller than 5 MB.",
    };
  }

  return { isValid: true };
}

export function validateCoverFile(file: File): { isValid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "Please select a valid image file (JPEG, PNG, or WebP).",
    };
  }

  if (file.size > MAX_COVER_INPUT_SIZE_BYTES) {
    return {
      isValid: false,
      error: "Cover image must be smaller than 15 MB before compression.",
    };
  }

  return { isValid: true };
}

/**
 * Resizes an avatar image with center-square crop to targetSize x targetSize.
 */
export async function compressAvatarToWebP(
  file: File,
  targetSize = 400,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Unable to create canvas context"));
            return;
          }

          // Center crop
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.drawImage(
            img,
            sx,
            sy,
            minSide,
            minSide,
            0,
            0,
            targetSize,
            targetSize
          );

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Canvas conversion to WebP failed"));
              }
            },
            "image/webp",
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image file"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses a book cover preserving its natural aspect ratio.
 * Downscales so the longer dimension does not exceed maxLongEdge (default 1200px).
 */
export async function compressCoverToWebP(
  file: File,
  maxLongEdge = 1200,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate scaled dimensions maintaining aspect ratio
          if (width > maxLongEdge || height > maxLongEdge) {
            if (width >= height) {
              height = Math.round((height * maxLongEdge) / width);
              width = maxLongEdge;
            } else {
              width = Math.round((width * maxLongEdge) / height);
              height = maxLongEdge;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Unable to create canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Canvas conversion to WebP failed"));
              }
            },
            "image/webp",
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error("Failed to load book cover image"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}
