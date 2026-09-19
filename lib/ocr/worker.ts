import type { Worker } from "tesseract.js";

let activeWorker: Worker | null = null;
let isInitializing = false;

export interface OcrProgressCallback {
  (progress: number, status: string): void;
}

/**
 * Lazily creates or reuses a Tesseract.js worker instance for the active scanner session.
 * Dynamically imports tesseract.js only when OCR is explicitly invoked.
 * Initializes with English and Sinhala languages with graceful fallback to English.
 */
export async function getOcrWorker(onProgress?: OcrProgressCallback): Promise<Worker> {
  if (activeWorker) {
    return activeWorker;
  }

  if (isInitializing) {
    // Wait for ongoing initialization
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (activeWorker) return activeWorker;
  }

  isInitializing = true;
  try {
    if (onProgress) {
      onProgress(0.1, "Initializing text recognition engine...");
    }

    // Dynamic import of tesseract.js so it is never bundled in the main chunk
    const { createWorker } = await import("tesseract.js");

    // Attempt to load English and Sinhala
    let worker: Worker;
    try {
      worker = await createWorker(["eng", "sin"], 1, {
        logger: (m) => {
          if (onProgress && m.status === "recognizing text") {
            onProgress(0.2 + (m.progress || 0) * 0.7, "Reading text on cover...");
          }
        },
      });
    } catch (sinErr) {
      console.warn("Sinhala OCR language pack not available, falling back to English only:", sinErr);
      worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (onProgress && m.status === "recognizing text") {
            onProgress(0.2 + (m.progress || 0) * 0.7, "Reading text on cover...");
          }
        },
      });
    }

    activeWorker = worker;
    return activeWorker;
  } finally {
    isInitializing = false;
  }
}

/**
 * Cleanly terminates the active Tesseract worker and frees memory.
 */
export async function terminateOcrWorker(): Promise<void> {
  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch (err) {
      console.warn("Error terminating Tesseract worker:", err);
    } finally {
      activeWorker = null;
      isInitializing = false;
    }
  }
}
