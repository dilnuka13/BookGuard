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
import {
  PRESET_LANGUAGES,
  PRESET_CATEGORIES,
  type LibraryItem,
} from "@/types/library";
import {
  Camera,
  X,
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

export function BulkAddForm() {
  const router = useRouter();
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Session Stats
  const [sessionCount, setSessionCount] = React.useState(0);
  const [sessionBooks, setSessionBooks] = React.useState<LibraryItem[]>([]);

  // Form Fields
  const [title, setTitle] = React.useState("");
  const [author, setAuthor] = React.useState("");
  const [isbn, setIsbn] = React.useState("");
  const [showMoreDetails, setShowMoreDetails] = React.useState(false);

  // Advanced Fields
  const [publisher, setPublisher] = React.useState("");
  const [publishedYear, setPublishedYear] = React.useState("");
  const [language, setLanguage] = React.useState("Sinhala");
  const [category, setCategory] = React.useState("Fiction");
  const [notes, setNotes] = React.useState("");

  // Cover
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = React.useState<string | null>(null);

  // Status
  const [isSaving, setIsSaving] = React.useState(false);
  const [titleError, setTitleError] = React.useState<string | null>(null);
  const [lastAddedTitle, setLastAddedTitle] = React.useState<string | null>(null);

  // Auto-focus title on mount
  React.useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateCoverFile(file);
    if (!validation.isValid) {
      alert(validation.error || "Invalid image");
      return;
    }

    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const handleResetForm = () => {
    setTitle("");
    setAuthor("");
    setIsbn("");
    setPublisher("");
    setPublishedYear("");
    setNotes("");
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setTitleError(null);

    // Keep advanced details open/closed as user chose
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  };

  const saveBook = async (): Promise<LibraryItem | null> => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Book title is required.");
      titleInputRef.current?.focus();
      return null;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in to add books.");
    }

    const normTitle = normalizeBookTitle(trimmedTitle);
    const normAuthor = normalizeAuthorName(author);
    const normIsbn = normalizeISBN(isbn);
    const bookCode = generateBookCode();

    let parsedYear: number | null = null;
    if (publishedYear.trim()) {
      const yr = parseInt(publishedYear.trim(), 10);
      if (!isNaN(yr) && yr >= 1000 && yr <= 2100) {
        parsedYear = yr;
      }
    }

    // 1. Insert book record
    const { data: inserted, error: insertError } = await supabase
      .from("library_items")
      .insert({
        user_id: user.id,
        book_code: bookCode,
        title: trimmedTitle,
        normalized_title: normTitle,
        author: author.trim() || null,
        normalized_author: normAuthor,
        isbn13: normIsbn.isbn13 || (normIsbn.clean?.length === 13 ? normIsbn.clean : null),
        isbn10: normIsbn.isbn10 || (normIsbn.clean?.length === 10 ? normIsbn.clean : null),
        publisher: publisher.trim() || null,
        published_year: parsedYear,
        language: language || null,
        category: category || null,
        notes: notes.trim() || null,
        quantity: 1,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      throw new Error(`Failed to save book: ${insertError?.message || "Unknown error"}`);
    }

    let finalItem = inserted as LibraryItem;

    // 2. Upload cover if attached
    if (coverFile) {
      try {
        const compressed = await compressCoverToWebP(coverFile);
        const uploadRes = await uploadBookCover(
          supabase,
          user.id,
          inserted.id,
          compressed
        );

        const { data: updated } = await supabase
          .from("library_items")
          .update({
            cover_url: uploadRes.publicUrl,
            cover_storage_path: uploadRes.storagePath,
          })
          .eq("id", inserted.id)
          .select("*")
          .single();

        if (updated) {
          finalItem = updated as LibraryItem;
        }
      } catch (err) {
        console.warn("Bulk add cover upload error:", err);
      }
    }

    return finalItem;
  };

  // "Save & Add Next" Handler
  const handleSaveAndAddNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      const saved = await saveBook();
      if (saved) {
        setSessionCount((prev) => prev + 1);
        setSessionBooks((prev) => [saved, ...prev.slice(0, 4)]);
        setLastAddedTitle(saved.title);
        handleResetForm();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save book.");
    } finally {
      setIsSaving(false);
    }
  };

  // "Save & Finish" Handler
  const handleSaveAndFinish = async () => {
    if (isSaving) return;

    // If user filled in a title, save it first before finishing
    if (title.trim()) {
      try {
        setIsSaving(true);
        const saved = await saveBook();
        if (saved) {
          router.push("/library");
          router.refresh();
          return;
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to save book.");
        setIsSaving(false);
        return;
      }
    }

    // Otherwise simply navigate to library
    router.push("/library");
    router.refresh();
  };

  // Quick Undo of most recently added book
  const handleUndoRecent = async (book: LibraryItem) => {
    if (!confirm(`Remove "${book.title}" from this session?`)) return;

    try {
      const supabase = createClient();
      if (book.cover_storage_path) {
        await deleteBookCover(supabase, book.cover_storage_path);
      }
      await supabase.from("library_items").delete().eq("id", book.id);
      setSessionBooks((prev) => prev.filter((b) => b.id !== book.id));
      setSessionCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Undo error:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Session Counter Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
            {sessionCount}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Bulk Setup Mode
            </p>
            <p className="text-xs text-muted-foreground">
              {sessionCount === 0
                ? "Add books from your shelf one after another."
                : `Books added this session: ${sessionCount}`}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveAndFinish}
          disabled={isSaving}
          className="rounded-xl border-emerald-500/30"
        >
          <span>Done</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Quick feedback banner on last saved */}
      {lastAddedTitle && (
        <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3.5 py-2 text-xs text-muted-foreground animate-in fade-in-0 duration-150">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Saved &ldquo;{lastAddedTitle}&rdquo;</span>
        </div>
      )}

      {/* Fast Entry Form */}
      <form onSubmit={handleSaveAndAddNext} className="space-y-4">
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-sm space-y-4">
          {/* Header & Quick Cover Picker */}
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
              Book #{sessionCount + 1}
            </h3>

            <div className="flex items-center gap-2">
              {coverPreviewUrl ? (
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-7 overflow-hidden rounded border border-border">
                    <Image
                      src={coverPreviewUrl}
                      alt="Cover"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreviewUrl(null);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    title="Remove cover"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 text-xs gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Cover (Optional)</span>
                </Button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverSelect}
              />
            </div>
          </div>

          {/* Title (Primary Autofocused Input) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bulk-title" className="text-xs">
                Title <span className="text-destructive">*</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">Press Enter to save</span>
            </div>
            <Input
              ref={titleInputRef}
              id="bulk-title"
              type="text"
              required
              placeholder="Book title (e.g. මඩොල් දූව or Gamperaliya)"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              error={Boolean(titleError)}
              className="h-12 text-sm sm:text-base font-semibold"
            />
            {titleError && (
              <p className="text-xs text-destructive">{titleError}</p>
            )}
          </div>

          {/* Author */}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-author" className="text-xs">
              Author
            </Label>
            <Input
              id="bulk-author"
              type="text"
              placeholder="e.g. Martin Wickramasinghe"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          {/* ISBN (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-isbn" className="text-xs">
              ISBN (Optional)
            </Label>
            <Input
              id="bulk-isbn"
              type="text"
              placeholder="e.g. 9789552108174 or leave empty"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
            />
          </div>

          {/* Expandable "More Details" */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus:outline-none"
            >
              <span>{showMoreDetails ? "Hide More Details" : "+ More Details (Publisher, Year, Category)"}</span>
              {showMoreDetails ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showMoreDetails && (
              <div className="mt-4 space-y-4 pt-4 border-t border-border/60 animate-in fade-in-0 duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="bulk-publisher" className="text-[11px]">Publisher</Label>
                    <Input
                      id="bulk-publisher"
                      type="text"
                      placeholder="e.g. Sarasavi"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="bulk-year" className="text-[11px]">Published Year</Label>
                    <Input
                      id="bulk-year"
                      type="number"
                      min="1000"
                      max="2100"
                      placeholder="e.g. 2020"
                      value={publishedYear}
                      onChange={(e) => setPublishedYear(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Language</Label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground shadow-sm"
                    >
                      {PRESET_LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Category</Label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground shadow-sm"
                    >
                      {PRESET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bulk-notes" className="text-[11px]">Notes</Label>
                  <Input
                    id="bulk-notes"
                    type="text"
                    placeholder="Shelf location, remarks..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            type="submit"
            variant="brandGradient"
            size="lg"
            disabled={isSaving}
            className="w-full sm:flex-1 h-13 text-base gap-2 rounded-2xl shadow-lg shadow-emerald-600/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving Book...</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Save &amp; Add Next</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleSaveAndFinish}
            disabled={isSaving}
            className="w-full sm:w-auto rounded-2xl h-13"
          >
            <span>Save &amp; Finish</span>
          </Button>
        </div>
      </form>

      {/* Recently Added in This Session Drawer */}
      {sessionBooks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Recently Added in this session
            </span>
            <span className="text-[11px] text-muted-foreground">
              Showing last {sessionBooks.length}
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {sessionBooks.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-2 text-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-foreground truncate">
                    {b.title}
                  </span>
                  {b.author && (
                    <span className="text-muted-foreground truncate hidden sm:inline">
                      by {b.author}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleUndoRecent(b)}
                  className="text-[11px] text-destructive hover:underline shrink-0"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
