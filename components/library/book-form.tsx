"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { normalizeBookTitle, normalizeAuthorName, normalizeISBN } from "@/lib/books/normalize";
import { generateBookCode } from "@/lib/books/book-code";
import { validateCoverFile, compressCoverToWebP } from "@/lib/utils/image";
import { uploadBookCover, deleteBookCover } from "@/lib/storage/book-cover";
import { computeDHash } from "@/lib/image-hash/dhash";
import { trackISBN } from "@/lib/isbn/tracker";
import { checkExactIsbnInLibrary } from "@/lib/books/queries";
import {
  PRESET_LANGUAGES,
  PRESET_CATEGORIES,
  type LibraryItem,
  type BookFormValues,
} from "@/types/library";
import Link from "next/link";
import { RemoteScanQRModal } from "@/components/remote-scan/remote-scan-qr-modal";
import { lookupCommunityBook } from "@/lib/books/community-lookup";
import { triggerHaptic } from "@/lib/utils/haptics";
import {
  Camera,
  Upload,
  X,
  Plus,
  Minus,
  AlertCircle,
  Check,
  Loader2,
  BookOpen,
  Smartphone,
  Zap,
} from "lucide-react";

interface BookFormProps {
  mode: "add" | "edit";
  initialBook?: LibraryItem;
  onSuccess?: (bookId: string) => void;
}

export function BookForm({ mode, initialBook, onSuccess }: BookFormProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form Fields
  const [title, setTitle] = React.useState(initialBook?.title || "");
  const [author, setAuthor] = React.useState(initialBook?.author || "");
  const [isbn13, setIsbn13] = React.useState(initialBook?.isbn13 || "");
  const [isbn10, setIsbn10] = React.useState(initialBook?.isbn10 || "");
  const [publisher, setPublisher] = React.useState(initialBook?.publisher || "");
  const [edition, setEdition] = React.useState(initialBook?.edition || "");
  const [publishedYear, setPublishedYear] = React.useState<string>(
    initialBook?.published_year ? String(initialBook.published_year) : ""
  );
  const [language, setLanguage] = React.useState(initialBook?.language || "Sinhala");
  const [customLanguage, setCustomLanguage] = React.useState("");
  const [category, setCategory] = React.useState(initialBook?.category || "Fiction");
  const [customCategory, setCustomCategory] = React.useState("");
  const [quantity, setQuantity] = React.useState<number>(initialBook?.quantity || 1);
  const [purchasePrice, setPurchasePrice] = React.useState<string>(
    initialBook?.purchase_price !== null && initialBook?.purchase_price !== undefined
      ? String(initialBook.purchase_price)
      : ""
  );
  const [purchaseDate, setPurchaseDate] = React.useState(initialBook?.purchase_date || "");
  const [purchasePlace, setPurchasePlace] = React.useState(initialBook?.purchase_place || "");
  const [notes, setNotes] = React.useState(initialBook?.notes || "");

  // Cover Image State
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = React.useState<string | null>(
    initialBook?.cover_url || null
  );
  const [removeCoverFlag, setRemoveCoverFlag] = React.useState(false);
  const [prefilledCoverHash, setPrefilledCoverHash] = React.useState<string | null>(
    initialBook?.cover_hash || null
  );

  // Community Auto-fill state
  const [communityNotice, setCommunityNotice] = React.useState<string | null>(null);

  // Helper to query and auto-fill details from community library items
  const tryCommunityAutofill = React.useCallback(async (candidateIsbn: string) => {
    if (!candidateIsbn || !candidateIsbn.trim()) return;
    try {
      const comm = await lookupCommunityBook(candidateIsbn);
      if (comm && comm.title) {
        setTitle((prev) => (prev.trim() ? prev : comm.title));
        if (comm.author) setAuthor((prev) => (prev.trim() ? prev : comm.author!));
        if (comm.publisher) setPublisher((prev) => (prev.trim() ? prev : comm.publisher!));
        if (comm.edition) setEdition((prev) => (prev.trim() ? prev : comm.edition!));
        if (comm.published_year) setPublishedYear((prev) => (prev.trim() ? prev : String(comm.published_year)));
        if (comm.language) setLanguage(comm.language);
        if (comm.category) setCategory(comm.category);
        if (comm.cover_url && !coverPreviewUrl) {
          setCoverPreviewUrl(comm.cover_url);
          if (comm.cover_hash) setPrefilledCoverHash(comm.cover_hash);
        }

        setCommunityNotice(`✨ Auto-filled from BookGuard Community: "${comm.title}"`);
        triggerHaptic("success");
        setTimeout(() => setCommunityNotice(null), 8000);
      }
    } catch (e) {
      console.warn("Community auto-fill error:", e);
    }
  }, [coverPreviewUrl]);

  // Load prefill values from scanner if coming from a scan result
  React.useEffect(() => {
    if (typeof window !== "undefined" && mode === "add") {
      const prefillJson = window.sessionStorage.getItem("bookguard_scan_prefill");
      if (prefillJson) {
        try {
          const data = JSON.parse(prefillJson);
          if (data.title) setTitle(data.title);
          if (data.author) setAuthor(data.author);
          if (data.isbn) {
            const tracked = trackISBN(data.isbn);
            if (tracked.isbn13) setIsbn13(tracked.isbn13);
            else if (data.isbn.length === 13) setIsbn13(data.isbn);

            if (tracked.isbn10) setIsbn10(tracked.isbn10);
            else if (data.isbn.length === 10) setIsbn10(data.isbn);

            if (!data.title) {
              tryCommunityAutofill(data.isbn);
            }
          }
          if (data.publisher) setPublisher(data.publisher);
          if (data.edition) setEdition(data.edition);
          if (data.publishedYear) setPublishedYear(String(data.publishedYear));
          if (data.coverUrl) setCoverPreviewUrl(data.coverUrl);
          if (data.coverHash) setPrefilledCoverHash(data.coverHash);

          // Clear after reading so it doesn't affect future manual adds
          window.sessionStorage.removeItem("bookguard_scan_prefill");
        } catch (e) {
          console.warn("Failed to parse scan prefill data:", e);
        }
      }
    }
  }, [mode, tryCommunityAutofill]);

  // UI state
  const [titleError, setTitleError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Auto-sync between ISBN-13 and ISBN-10 to prevent duplicate formats
  const handleIsbn13Change = (val: string) => {
    setIsbn13(val);
    const tracked = trackISBN(val);
    if (tracked.isValid && tracked.isbn10 && (!isbn10 || isbn10.length === 10)) {
      setIsbn10(tracked.isbn10);
    }
    const cleanDigits = val.replace(/[^0-9X]/gi, "");
    if (cleanDigits.length === 13 && !title.trim()) {
      tryCommunityAutofill(val);
    }
  };

  const handleIsbn10Change = (val: string) => {
    setIsbn10(val);
    const tracked = trackISBN(val);
    if (tracked.isValid && tracked.isbn13 && (!isbn13 || isbn13.length === 13)) {
      setIsbn13(tracked.isbn13);
    }
    const cleanDigits = val.replace(/[^0-9X]/gi, "");
    if (cleanDigits.length === 10 && !title.trim()) {
      tryCommunityAutofill(val);
    }
  };

  // Remote Phone Scanner States
  const [isRemoteScanModalOpen, setIsRemoteScanModalOpen] = React.useState(false);
  const [remoteScanSuccessMessage, setRemoteScanSuccessMessage] = React.useState<string | null>(null);
  const [isbnDuplicateWarning, setIsbnDuplicateWarning] = React.useState<string | null>(null);
  const [isbnHighlight, setIsbnHighlight] = React.useState(false);

  // Handle scanned barcode coming wirelessly from remote phone
  const handleRemoteBarcodeScanned = React.useCallback(async (barcode: string) => {
    const tracked = trackISBN(barcode);
    if (tracked.isbn13) {
      setIsbn13(tracked.isbn13);
      if (tracked.isbn10) setIsbn10(tracked.isbn10);
    } else if (tracked.isbn10) {
      setIsbn10(tracked.isbn10);
      if (tracked.isbn13) setIsbn13(tracked.isbn13);
    } else {
      setIsbn13(barcode);
    }

    setIsbnHighlight(true);
    setRemoteScanSuccessMessage(`✓ Auto-filled ISBN from phone: ${barcode}`);
    setTimeout(() => {
      setIsbnHighlight(false);
    }, 3000);
    setTimeout(() => {
      setRemoteScanSuccessMessage(null);
    }, 6000);

    // Try community auto-fill if title is not yet entered
    if (!title.trim()) {
      tryCommunityAutofill(barcode);
    }

    // Run existing duplicate check in user's library
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const existing = await checkExactIsbnInLibrary(supabase, user.id, barcode);
        if (existing) {
          setIsbnDuplicateWarning(
            `Notice: Book "${existing.title}" is already in your library with this ISBN (Code: ${existing.book_code}).`
          );
        } else {
          setIsbnDuplicateWarning(null);
        }
      }
    } catch (e) {
      console.warn("Duplicate check error:", e);
    }
  }, [title, tryCommunityAutofill]);

  // Handle Cover File Selection
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateCoverFile(file);
    if (!validation.isValid) {
      setFormError(validation.error || "Invalid image file");
      return;
    }

    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
    setRemoveCoverFlag(false);
    setFormError(null);
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setRemoveCoverFlag(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setFormError(null);
    setTitleError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Book title is required.");
      triggerHaptic("warning");
      const titleInput = document.getElementById("book-title");
      if (titleInput) {
        titleInput.scrollIntoView({ behavior: "smooth", block: "center" });
        titleInput.focus();
      }
      return;
    }

    // Parse Year
    let parsedYear: number | null = null;
    if (publishedYear.trim()) {
      const yr = parseInt(publishedYear.trim(), 10);
      if (isNaN(yr) || yr < 1000 || yr > 2100) {
        setFormError("Published year must be between 1000 and 2100.");
        return;
      }
      parsedYear = yr;
    }

    // Parse Price
    let parsedPrice: number | null = null;
    if (purchasePrice.trim()) {
      const pr = parseFloat(purchasePrice.trim());
      if (isNaN(pr) || pr < 0) {
        setFormError("Purchase price must be a non-negative number.");
        return;
      }
      parsedPrice = pr;
    }

    // Normalize and auto-sync ISBN-13 and ISBN-10
    let final13 = normalizeISBN(isbn13).clean;
    let final10 = normalizeISBN(isbn10).clean;

    if (final13 && !final10) {
      const tracked = trackISBN(final13);
      if (tracked.isbn10) final10 = tracked.isbn10;
    } else if (final10 && !final13) {
      const tracked = trackISBN(final10);
      if (tracked.isbn13) final13 = tracked.isbn13;
    }

    const finalLanguage =
      language === "Other" && customLanguage.trim()
        ? customLanguage.trim()
        : language;

    const finalCategory =
      category === "Other" && customCategory.trim()
        ? customCategory.trim()
        : category;

    try {
      setIsSubmitting(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to save books.");
      }

      const normalizedTitle = normalizeBookTitle(trimmedTitle);
      const normalizedAuthor = normalizeAuthorName(author);

      // Compute client-side perceptual dHash if new cover file is selected
      let computedCoverHash: string | null = prefilledCoverHash;
      if (coverFile) {
        try {
          computedCoverHash = await computeDHash(coverFile);
        } catch (hErr) {
          console.warn("Cover hashing warning:", hErr);
        }
      } else if (removeCoverFlag) {
        computedCoverHash = null;
      }

      let savedBookId = initialBook?.id;
      let existingStoragePath = initialBook?.cover_storage_path;
      let finalCoverUrl = initialBook?.cover_url || null;
      let finalStoragePath = initialBook?.cover_storage_path || null;

      if (mode === "add") {
        // Prevent duplicate books from being saved under different ISBN formats
        if (final13 || final10) {
          const checkCode = final13 || final10 || "";
          const existing = await checkExactIsbnInLibrary(supabase, user.id, checkCode);
          if (existing) {
            setFormError(
              `This book is already in your library! "${existing.title}" is already registered (Book Code: ${existing.book_code}).`
            );
            setIsSubmitting(false);
            return;
          }
        }

        const bookCode = generateBookCode();

        // 1. Insert book record
        const { data: inserted, error: insertError } = await supabase
          .from("library_items")
          .insert({
            user_id: user.id,
            book_code: bookCode,
            title: trimmedTitle,
            normalized_title: normalizedTitle,
            author: author.trim() || null,
            normalized_author: normalizedAuthor,
            isbn13: final13 || null,
            isbn10: final10 || null,
            publisher: publisher.trim() || null,
            edition: edition.trim() || null,
            published_year: parsedYear,
            language: finalLanguage || null,
            category: finalCategory || null,
            cover_url: coverPreviewUrl || null,
            cover_storage_path: null,
            cover_hash: computedCoverHash,
            quantity: Math.max(1, quantity),
            purchase_price: parsedPrice,
            purchase_date: purchaseDate || null,
            purchase_place: purchasePlace.trim() || null,
            notes: notes.trim() || null,
          })
          .select("id")
          .single();

        if (insertError || !inserted) {
          throw new Error(`Failed to save book: ${insertError?.message || "Unknown error"}`);
        }

        savedBookId = inserted.id;

        // 2. Upload cover if provided
        if (coverFile && savedBookId) {
          try {
            const compressedBlob = await compressCoverToWebP(coverFile);
            const uploadRes = await uploadBookCover(
              supabase,
              user.id,
              savedBookId,
              compressedBlob
            );

            await supabase
              .from("library_items")
              .update({
                cover_url: uploadRes.publicUrl,
                cover_storage_path: uploadRes.storagePath,
                cover_hash: computedCoverHash,
              })
              .eq("id", savedBookId);
          } catch (coverErr) {
            console.error("Cover upload warning:", coverErr);
            // Non-fatal: book is safely created, alert user
            setFormError("Book was saved, but cover image upload failed. You can add the cover later by editing the book.");
          }
        }
      } else if (mode === "edit" && initialBook) {
        // Handle cover removal
        if (removeCoverFlag && existingStoragePath) {
          await deleteBookCover(supabase, existingStoragePath);
          finalCoverUrl = null;
          finalStoragePath = null;
        }

        // Handle cover replacement
        if (coverFile && savedBookId) {
          try {
            if (existingStoragePath) {
              await deleteBookCover(supabase, existingStoragePath);
            }
            const compressedBlob = await compressCoverToWebP(coverFile);
            const uploadRes = await uploadBookCover(
              supabase,
              user.id,
              savedBookId,
              compressedBlob
            );
            finalCoverUrl = uploadRes.publicUrl;
            finalStoragePath = uploadRes.storagePath;
          } catch (coverErr) {
            console.error("Cover upload error:", coverErr);
            setFormError("Book details updated, but cover upload failed.");
          }
        }

        // Update book row
        const { error: updateError } = await supabase
          .from("library_items")
          .update({
            title: trimmedTitle,
            normalized_title: normalizedTitle,
            author: author.trim() || null,
            normalized_author: normalizedAuthor,
            isbn13: final13 || null,
            isbn10: final10 || null,
            publisher: publisher.trim() || null,
            edition: edition.trim() || null,
            published_year: parsedYear,
            language: finalLanguage || null,
            category: finalCategory || null,
            quantity: Math.max(1, quantity),
            purchase_price: parsedPrice,
            purchase_date: purchaseDate || null,
            purchase_place: purchasePlace.trim() || null,
            notes: notes.trim() || null,
            cover_url: finalCoverUrl,
            cover_storage_path: finalStoragePath,
            cover_hash: computedCoverHash,
          })
          .eq("id", initialBook.id);

        if (updateError) {
          throw new Error(`Failed to update book: ${updateError.message}`);
        }
      }

      if (savedBookId) {
        if (onSuccess) {
          onSuccess(savedBookId);
        } else {
          router.push(`/library/${savedBookId}`);
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      setFormError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while saving the book."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 md:pb-6">
      {/* Cover Uploader Section */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
          Book Cover Image (Optional)
        </Label>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Cover Preview */}
          <div className="relative h-44 w-32 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/30 aspect-[2/3] flex items-center justify-center shadow-sm">
            {coverPreviewUrl ? (
              <Image
                src={coverPreviewUrl}
                alt="Book cover preview"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-3 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mb-1 opacity-40" />
                <span className="text-[10px]">No Cover</span>
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <p className="text-sm font-semibold text-foreground">
              {coverPreviewUrl ? "Cover Photo Attached" : "Add a Cover Photo"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Auto-compressed to WebP (max 1200px long edge). You can take a photo with your mobile camera or upload from files.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{coverPreviewUrl ? "Change Cover" : "Upload Cover"}</span>
              </Button>

              {coverPreviewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCover}
                  className="gap-1.5 text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverSelect}
            />
          </div>
        </div>
      </div>

      {/* Primary Information */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
            Basic Details
          </h3>
          <Button
            type="button"
            variant="brandGradient"
            size="sm"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="h-8 text-xs font-bold gap-1.5 px-3 rounded-xl shadow-sm"
            title="Save book immediately with entered title"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 fill-current text-amber-300" />
                <span>Quick Save</span>
              </>
            )}
          </Button>
        </div>

        {/* Community Auto-fill Success Notice */}
        {communityNotice && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">✨</span>
              <span>{communityNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setCommunityNotice(null)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Title (Required) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="book-title">
              Book Title <span className="text-destructive">*</span>
            </Label>
            <span className="text-[10px] text-muted-foreground">Required</span>
          </div>
          <Input
            id="book-title"
            type="text"
            required
            placeholder="e.g. Madol Doova or මඩොල් දූව"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            error={Boolean(titleError)}
          />
          {titleError && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {titleError}
            </p>
          )}
        </div>

        {/* Author */}
        <div className="space-y-1.5">
          <Label htmlFor="book-author">Author / Writer</Label>
          <Input
            id="book-author"
            type="text"
            placeholder="e.g. Martin Wickramasinghe"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>

        {/* ISBN Section Header with Scanner Options */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                ISBN / Barcode
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Type manually or scan book barcode wirelessly
              </p>
            </div>

            {/* Two Scanner Options as requested */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-xs gap-1.5 rounded-xl border-border hover:bg-muted"
                title="Open local device camera scanner"
              >
                <Link href="/scan">
                  <Camera className="w-3.5 h-3.5 text-primary" />
                  <span>Use Device Camera</span>
                </Link>
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsRemoteScanModalOpen(true)}
                className="h-8 text-xs font-semibold gap-1.5 rounded-xl shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                title="Use your phone camera as a wireless scanner"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Scan With Phone</span>
              </Button>
            </div>
          </div>

          {/* Feedback alerts from phone scanning */}
          {remoteScanSuccessMessage && (
            <div className="mb-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{remoteScanSuccessMessage}</span>
            </div>
          )}

          {isbnDuplicateWarning && (
            <div className="mb-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{isbnDuplicateWarning}</span>
            </div>
          )}

          {/* ISBN Fields (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="book-isbn13">ISBN-13 (Optional)</Label>
              <Input
                id="book-isbn13"
                type="text"
                placeholder="e.g. 9789552108174"
                value={isbn13}
                onChange={(e) => handleIsbn13Change(e.target.value)}
                className={`transition-all duration-300 ${
                  isbnHighlight
                    ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10 font-bold"
                    : ""
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="book-isbn10">ISBN-10 (Optional)</Label>
              <Input
                id="book-isbn10"
                type="text"
                placeholder="e.g. 9552108170"
                value={isbn10}
                onChange={(e) => handleIsbn10Change(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Publishing & Classification */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
          Publishing & Category
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="book-publisher">Publisher</Label>
            <Input
              id="book-publisher"
              type="text"
              placeholder="e.g. Sarasa / Sarasavi"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="book-edition">Edition</Label>
            <Input
              id="book-edition"
              type="text"
              placeholder="e.g. 1st Edition or 2022 Reprint"
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="book-year">Published Year</Label>
            <Input
              id="book-year"
              type="number"
              min="1000"
              max="2100"
              placeholder="e.g. 1947"
              value={publishedYear}
              onChange={(e) => setPublishedYear(e.target.value)}
            />
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <Label>Language</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  language === lang
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted/60"
                }`}
              >
                {lang}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLanguage("Other")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                language === "Other"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted/60"
              }`}
            >
              Other
            </button>
          </div>

          {language === "Other" && (
            <Input
              type="text"
              placeholder="Enter custom language..."
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              className="mt-2 text-xs"
            />
          )}
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                  category === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {category === "Other" && (
            <Input
              type="text"
              placeholder="Enter custom category..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="mt-2 text-xs"
            />
          )}
        </div>
      </div>

      {/* Inventory & Purchase Details */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
          Inventory & Purchase
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Quantity Stepper */}
          <div className="space-y-1.5">
            <Label>Quantity Owned</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-11 w-11 rounded-xl"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <span className="w-12 text-center text-lg font-bold text-foreground">
                {quantity}
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-11 w-11 rounded-xl"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Purchase Price (LKR / Currency) */}
          <div className="space-y-1.5">
            <Label htmlFor="book-price">Purchase Price (Optional)</Label>
            <Input
              id="book-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 1500.00"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="book-purchase-date">Purchase Date (Optional)</Label>
            <Input
              id="book-purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="book-purchase-place">Purchase Store / Place (Optional)</Label>
            <Input
              id="book-purchase-place"
              type="text"
              placeholder="e.g. Colombo Book Fair / Sarasavi"
              value={purchasePlace}
              onChange={(e) => setPurchasePlace(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="book-notes">Personal Notes (Optional)</Label>
          <textarea
            id="book-notes"
            rows={3}
            placeholder="e.g. Shelf B, signed by author, gift from friend..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-input bg-card p-3 text-xs sm:text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Error display */}
      {formError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3.5 text-xs text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Button
          type="submit"
          variant="brandGradient"
          size="lg"
          disabled={isSubmitting}
          className="w-full sm:w-auto min-w-[160px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{mode === "add" ? "Saving Book..." : "Updating Book..."}</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>{mode === "add" ? "Save Book to Shelf" : "Save Changes"}</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
      </div>

      {/* Wireless Remote Phone Scanner Modal */}
      <RemoteScanQRModal
        isOpen={isRemoteScanModalOpen}
        onClose={() => setIsRemoteScanModalOpen(false)}
        onBarcodeScanned={handleRemoteBarcodeScanned}
      />
    </form>
  );
}
