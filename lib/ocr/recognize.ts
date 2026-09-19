import { getOcrWorker, type OcrProgressCallback } from "./worker";
import { normalizeOcrText, extractCandidatesFromOcr, type OcrExtractedCandidates } from "./normalize";
import { loadImageSource } from "../image-hash/prepare";

export interface OcrRecognitionResult {
  rawText: string;
  normalizedText: string;
  candidates: OcrExtractedCandidates;
  confidence: number;
}

/**
 * Preprocesses an image on canvas for OCR:
 * - Resizes so longer dimension does not exceed maxDimension (1200px)
 * - Enhances contrast for clearer character recognition
 */
export async function preprocessImageForOcr(
  source: File | Blob | HTMLImageElement | HTMLCanvasElement | string,
  maxDimension = 1200
): Promise<HTMLCanvasElement> {
  const img = await loadImageSource(source);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Unable to create canvas context for OCR preprocessing");
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Moderate contrast boost
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const contrastFactor = 1.25; // 25% contrast increase
  const intercept = 128 * (1 - contrastFactor);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * contrastFactor + intercept));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrastFactor + intercept));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrastFactor + intercept));
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Performs OCR recognition on an image source.
 */
export async function recognizeCoverText(
  source: File | Blob | HTMLImageElement | HTMLCanvasElement | string,
  onProgress?: OcrProgressCallback
): Promise<OcrRecognitionResult> {
  if (onProgress) {
    onProgress(0.05, "Preparing image for text recognition...");
  }

  const preprocessedCanvas = await preprocessImageForOcr(source);
  const worker = await getOcrWorker(onProgress);

  if (onProgress) {
    onProgress(0.3, "Reading text on book cover...");
  }

  const result = await worker.recognize(preprocessedCanvas);

  const rawText = result.data.text || "";
  const confidence = result.data.confidence || 0;
  const normalizedText = normalizeOcrText(rawText);
  const candidates = extractCandidatesFromOcr(rawText);

  if (onProgress) {
    onProgress(1.0, "Text recognition complete.");
  }

  return {
    rawText,
    normalizedText,
    candidates,
    confidence: Number((confidence / 100).toFixed(2)),
  };
}
