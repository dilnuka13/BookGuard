"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CameraView } from "./camera-view";
import { ScannerReticle } from "./scanner-reticle";
import { ScannerControls } from "./scanner-controls";
import { ScanProgress } from "./scan-progress";
import { ScanResultView } from "./scan-result";
import { ManualIsbnDialog } from "./manual-isbn-dialog";
import { CoverUploadFallback } from "./cover-upload-fallback";
import { isBookBarcode, inspectISBN } from "@/lib/isbn/validate";
import { fetchBookMetadata } from "@/lib/isbn/lookup";
import { computeDHash } from "@/lib/image-hash/dhash";
import { recognizeCoverText } from "@/lib/ocr/recognize";
import { terminateOcrWorker } from "@/lib/ocr/worker";
import { matchBook, type ScannedBookInput } from "@/lib/matching/match-book";
import { getMatchCandidates, checkExactIsbnInLibrary } from "@/lib/books/queries";
import { recordScanHistory } from "@/lib/scanner/history";
import { checkOfflineIsbn } from "@/lib/offline/library-cache";
import { enqueueMutation } from "@/lib/offline/db";
import { triggerHaptic } from "@/lib/utils/haptics";
import { addToCart, checkCartDuplicate } from "@/lib/cart/queries";
import { addToWishlist, checkWishlistDuplicate } from "@/lib/wishlist/queries";
import type { MatchCandidate, MatchResult } from "@/lib/matching/types";
import { AlertCircle, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SmartBookScannerProps {
  userId: string;
}

type ScannerState =
  | "scanning"
  | "checking-library"
  | "looking-up-metadata"
  | "processing-cover"
  | "result";

export function SmartBookScanner({ userId }: SmartBookScannerProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const previewUrlRef = React.useRef<string | null>(null);

  // Scanner state
  const [scannerState, setScannerState] = React.useState<ScannerState>("scanning");
  const [progressStatus, setProgressStatus] = React.useState("Scanning barcode...");
  const [progressDetail, setProgressDetail] = React.useState<string | undefined>(undefined);
  const [matchResult, setMatchResult] = React.useState<MatchResult | null>(null);
  const [manualDialogOpen, setManualDialogOpen] = React.useState(false);

  // User's library candidates cache
  const [candidates, setCandidates] = React.useState<MatchCandidate[]>([]);
  const lastProcessedBarcodeRef = React.useRef<{ barcode: string; time: number } | null>(null);

  const cleanupPreviewUrl = React.useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const deliverResult = React.useCallback((result: MatchResult) => {
    setMatchResult(result);
    setScannerState("result");
    if (result.result === "OWNED") {
      triggerHaptic("warning");
    } else if (result.result === "POSSIBLE_DUPLICATE") {
      triggerHaptic("medium");
    } else if (result.result === "NEW") {
      triggerHaptic("success");
    }
  }, []);

  // Load user's library items on mount for instant client matching
  React.useEffect(() => {
    const supabase = createClient();
    getMatchCandidates(supabase, userId).then((items) => {
      setCandidates(items as MatchCandidate[]);
    });

    return () => {
      terminateOcrWorker();
      cleanupPreviewUrl();
    };
  }, [userId, cleanupPreviewUrl]);

  // Main ISBN Processing Pipeline
  const processIsbn = React.useCallback(
    async (isbn: string) => {
      const supabase = createClient();
      setScannerState("checking-library");
      setProgressStatus("Checking your shelf...");
      setProgressDetail(`Looking up ISBN ${isbn} in your personal collection`);

      try {
        // STEP 0: Check local IndexedDB cache first (works completely offline)
        try {
          const offlineMatch = await checkOfflineIsbn(isbn);
          if (offlineMatch) {
            const result: MatchResult = {
              result: "OWNED",
              confidence: 1.0,
              matchedBook: {
                id: offlineMatch.id,
                book_code: offlineMatch.book_code,
                title: offlineMatch.title,
                normalized_title: offlineMatch.normalized_title,
                author: offlineMatch.author,
                normalized_author: offlineMatch.normalized_author,
                isbn10: offlineMatch.isbn10,
                isbn13: offlineMatch.isbn13,
                barcode: offlineMatch.barcode,
                edition: offlineMatch.edition,
                publisher: offlineMatch.publisher,
                published_year: null,
                cover_url: offlineMatch.cover_url,
                cover_hash: offlineMatch.cover_hash,
                ocr_text: null,
                quantity: 1,
              },
              evidence: {
                isbnExact: true,
                titleScore: 1.0,
                authorScore: 1.0,
                editionConflict: false,
                reasons: ["Exact ISBN matched in your local offline library cache."],
              },
              scannedData: {
                isbn,
                title: offlineMatch.title,
                author: offlineMatch.author,
                edition: offlineMatch.edition,
                publisher: offlineMatch.publisher,
                coverUrl: offlineMatch.cover_url,
              },
            };

            deliverResult(result);
            if (typeof navigator !== "undefined" && navigator.onLine) {
              recordScanHistory(supabase, userId, result).catch(() => {});
            }
            return;
          }
        } catch (cacheErr) {
          console.warn("Offline cache check warning:", cacheErr);
        }

        // STEP 1: ALWAYS check user's authoritative library in Supabase
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          // In offline mode without cache match: inform user gracefully
          const offlineResult: MatchResult = {
            result: "NEW",
            confidence: 0.5,
            evidence: {
              isbnExact: false,
              titleScore: 0,
              authorScore: 0,
              editionConflict: false,
              reasons: [
                "Offline Mode: Not found in your cached library. Online metadata lookup is unavailable without internet.",
              ],
            },
            scannedData: { isbn },
          };
          deliverResult(offlineResult);
          return;
        }

        const localCopy = await checkExactIsbnInLibrary(supabase, userId, isbn);

        if (localCopy) {
          // Instant exact match found in personal library!
          const result: MatchResult = {
            result: "OWNED",
            confidence: 1.0,
            matchedBook: localCopy as MatchCandidate,
            evidence: {
              isbnExact: true,
              titleScore: 1.0,
              authorScore: 1.0,
              editionConflict: false,
              reasons: ["Exact ISBN match in your personal library."],
            },
            scannedData: {
              isbn,
              title: localCopy.title,
              author: localCopy.author,
              edition: localCopy.edition,
              publisher: localCopy.publisher,
              coverUrl: localCopy.cover_url,
            },
          };

          deliverResult(result);
          await recordScanHistory(supabase, userId, result);
          return;
        }

        // STEP 2: Not in library by exact ISBN -> Fetch metadata from Open Library / Google Books
        setScannerState("looking-up-metadata");
        setProgressStatus("Looking up book details...");
        setProgressDetail("Querying Open Library and Google Books databases");

        const metadata = await fetchBookMetadata(isbn);

        // STEP 3: Multi-signal smart match against user's library
        const scannedInput: ScannedBookInput = {
          isbn,
          title: metadata?.title || null,
          author: metadata?.authors ? metadata.authors.join(", ") : null,
          publisher: metadata?.publisher || null,
          edition: metadata?.edition || null,
          publishedYear: metadata?.publishedYear || null,
          coverUrl: metadata?.coverUrl || null,
        };

        const result = matchBook(scannedInput, candidates);
        deliverResult(result);
        await recordScanHistory(supabase, userId, result);
      } catch (err) {
        console.error("Error during ISBN scan processing:", err);
        // Fallback to unknown result
        const fallbackResult: MatchResult = {
          result: "UNKNOWN",
          confidence: 0,
          evidence: {
            isbnExact: false,
            titleScore: 0,
            authorScore: 0,
            editionConflict: false,
            reasons: ["A network or lookup error occurred while checking this ISBN."],
          },
          scannedData: { isbn },
        };
        deliverResult(fallbackResult);
      }
    },
    [userId, candidates, deliverResult]
  );

  // Handle barcode detected from CameraView
  const handleBarcodeDetected = React.useCallback(
    (rawBarcode: string) => {
      if (scannerState !== "scanning") return;

      const now = Date.now();
      if (
        lastProcessedBarcodeRef.current &&
        lastProcessedBarcodeRef.current.barcode === rawBarcode &&
        now - lastProcessedBarcodeRef.current.time < 3000
      ) {
        return; // Debounce duplicate triggers
      }

      lastProcessedBarcodeRef.current = { barcode: rawBarcode, time: now };

      // Validate if it's a book barcode (EAN-13 starting with 978 or 979)
      if (isBookBarcode(rawBarcode)) {
        processIsbn(rawBarcode);
        return;
      }

      // If it's another 10/13 digit number, inspect
      const inspection = inspectISBN(rawBarcode);
      if (inspection.isValid) {
        processIsbn(inspection.normalized);
      }
    },
    [scannerState, processIsbn]
  );

  // Process cover image (upload or capture) with dHash + OCR
  const processCoverImage = React.useCallback(
    async (file: File) => {
      setScannerState("processing-cover");
      setProgressStatus("Analyzing book cover...");
      setProgressDetail("Calculating visual fingerprint");

      try {
        const supabase = createClient();

        // 1. Calculate client-side 64-bit dHash
        const coverHash = await computeDHash(file);

        // 2. Perform client-side lazy-loaded OCR
        setProgressStatus("Reading cover text...");
        setProgressDetail("Recognizing English and Sinhala title text");

        let ocrText = "";
        let detectedTitle: string | undefined = undefined;
        let detectedAuthor: string | undefined = undefined;

        try {
          const ocrResult = await recognizeCoverText(file, (progress, status) => {
            setProgressDetail(status);
          });
          ocrText = ocrResult.rawText;
          detectedTitle = ocrResult.candidates.titleCandidate;
          detectedAuthor = ocrResult.candidates.authorCandidate;
        } catch (ocrErr) {
          console.warn("OCR recognition failed or skipped:", ocrErr);
        }

        // 3. Create local preview URL for scanned book with memory cleanup
        cleanupPreviewUrl();
        const localPreviewUrl = URL.createObjectURL(file);
        previewUrlRef.current = localPreviewUrl;

        const scannedInput: ScannedBookInput = {
          title: detectedTitle || null,
          author: detectedAuthor || null,
          coverHash,
          ocrText: ocrText || null,
          coverUrl: localPreviewUrl,
        };

        // 4. Run matching engine
        const result = matchBook(scannedInput, candidates);
        deliverResult(result);
        await recordScanHistory(supabase, userId, result);
      } catch (err) {
        console.error("Cover image processing failed:", err);
        const fallbackResult: MatchResult = {
          result: "UNKNOWN",
          confidence: 0,
          evidence: {
            isbnExact: false,
            titleScore: 0,
            authorScore: 0,
            editionConflict: false,
            reasons: ["Failed to analyze cover image. Please retry or enter ISBN manually."],
          },
          scannedData: {},
        };
        deliverResult(fallbackResult);
      }
    },
    [candidates, userId, cleanupPreviewUrl, deliverResult]
  );

  // Reset to active scanning mode
  const handleScanNext = React.useCallback(() => {
    cleanupPreviewUrl();
    setMatchResult(null);
    setScannerState("scanning");
    setProgressStatus("Scanning barcode...");
    setProgressDetail(undefined);
    lastProcessedBarcodeRef.current = null;
  }, [cleanupPreviewUrl]);

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Handle Add to Cart from Scanner (Supports Safe Offline Queueing)
  const handleAddToCart = React.useCallback(async () => {
    if (!matchResult) return;
    const supabase = createClient();
    const data = matchResult.scannedData;
    const isbn = data.isbn;

    // Safe offline mutation queue
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await enqueueMutation("ADD_TO_CART", {
        user_id: userId,
        title: data.title || `Book (${isbn || "Scanned"})`,
        author: data.author || null,
        isbn13: isbn && isbn.length === 13 ? isbn : null,
        isbn10: isbn && isbn.length === 10 ? isbn : null,
        publisher: data.publisher || null,
        edition: data.edition || null,
        cover_url: data.coverUrl || null,
        quantity: 1,
      });
      triggerHaptic("light");
      showToast("Offline: Saved to Cart sync queue!");
      return;
    }

    // Check duplicate in cart
    if (isbn) {
      const existing = await checkCartDuplicate(supabase, userId, { isbn13: isbn });
      if (existing) {
        showToast("Already in your Cart buying planner.");
        return;
      }
    }

    const { error } = await addToCart(supabase, {
      user_id: userId,
      title: data.title || `Book (${isbn || "Scanned"})`,
      author: data.author || null,
      isbn13: isbn && isbn.length === 13 ? isbn : null,
      isbn10: isbn && isbn.length === 10 ? isbn : null,
      publisher: data.publisher || null,
      edition: data.edition || null,
      cover_url: data.coverUrl || null,
      quantity: 1,
    });

    if (error) {
      triggerHaptic("error");
      showToast("Failed to add book to cart.");
    } else {
      triggerHaptic("light");
      showToast("Added to Cart buying planner!");
    }
  }, [matchResult, userId, showToast]);

  // Handle Add to Wishlist from Scanner (Supports Safe Offline Queueing)
  const handleAddToWishlist = React.useCallback(async () => {
    if (!matchResult) return;
    const supabase = createClient();
    const data = matchResult.scannedData;
    const isbn = data.isbn;

    // Safe offline mutation queue
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await enqueueMutation("ADD_TO_WISHLIST", {
        user_id: userId,
        title: data.title || `Book (${isbn || "Scanned"})`,
        author: data.author || null,
        isbn13: isbn && isbn.length === 13 ? isbn : null,
        isbn10: isbn && isbn.length === 10 ? isbn : null,
        publisher: data.publisher || null,
        edition: data.edition || null,
        cover_url: data.coverUrl || null,
      });
      triggerHaptic("light");
      showToast("Offline: Saved to Wishlist sync queue!");
      return;
    }

    // Check duplicate in wishlist
    const existing = await checkWishlistDuplicate(supabase, userId, {
      isbn13: isbn && isbn.length === 13 ? isbn : null,
      isbn10: isbn && isbn.length === 10 ? isbn : null,
      title: data.title || "",
      author: data.author || null,
    });

    if (existing) {
      showToast("Already in your Wishlist.");
      return;
    }

    const { error } = await addToWishlist(supabase, {
      user_id: userId,
      title: data.title || `Book (${isbn || "Scanned"})`,
      author: data.author || null,
      isbn13: isbn && isbn.length === 13 ? isbn : null,
      isbn10: isbn && isbn.length === 10 ? isbn : null,
      publisher: data.publisher || null,
      edition: data.edition || null,
      cover_url: data.coverUrl || null,
    });

    if (error) {
      triggerHaptic("error");
      showToast("Failed to add book to wishlist.");
    } else {
      triggerHaptic("light");
      showToast("Added to Wishlist!");
    }
  }, [matchResult, userId, showToast]);

  // Navigate to Add Book prefilled with scanned data
  const handleAddToLibrary = React.useCallback(() => {
    if (!matchResult) return;

    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "bookguard_scan_prefill",
          JSON.stringify(matchResult.scannedData)
        );
      }
    } catch {
      // Ignore sessionStorage issues
    }

    router.push("/library/add?from_scan=1");
  }, [matchResult, router]);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[460px] max-h-[780px] rounded-3xl overflow-hidden border border-border bg-black shadow-2xl flex flex-col">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 rounded-xl bg-card border border-border px-4 py-3 shadow-lg text-sm font-medium text-foreground flex items-center gap-2 animate-scale-in">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Gallery Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processCoverImage(file);
            e.target.value = "";
          }
        }}
      />

      {/* Camera Live Feed Layer */}
      {scannerState === "scanning" && (
        <>
          <CameraView
            isScanning={true}
            onBarcodeDetected={handleBarcodeDetected}
          />
          <ScannerReticle
            isScanning={true}
            statusText="Align barcode or book cover inside frame"
          />
          <ScannerControls
            onOpenManualIsbn={() => setManualDialogOpen(true)}
            onUploadImageClick={() => fileInputRef.current?.click()}
          />
        </>
      )}

      {/* Progress State Overlay */}
      {scannerState !== "scanning" && scannerState !== "result" && (
        <ScanProgress
          status={progressStatus}
          detail={progressDetail}
          onCancel={handleScanNext}
        />
      )}

      {/* Completed Scan Result View */}
      {scannerState === "result" && matchResult && (
        <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto my-auto">
            <ScanResultView
              matchResult={matchResult}
              onScanNext={handleScanNext}
              onAddToLibrary={handleAddToLibrary}
              onAddToCart={handleAddToCart}
              onAddToWishlist={handleAddToWishlist}
              onOpenManualIsbn={() => setManualDialogOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Manual ISBN Dialog */}
      <ManualIsbnDialog
        open={manualDialogOpen}
        onOpenChange={setManualDialogOpen}
        onSubmitIsbn={processIsbn}
      />
    </div>
  );
}
