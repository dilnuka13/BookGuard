import type { Database } from "./database.types";

export type LibraryItem = Database["public"]["Tables"]["library_items"]["Row"];
export type LibraryItemInsert = Database["public"]["Tables"]["library_items"]["Insert"];
export type LibraryItemUpdate = Database["public"]["Tables"]["library_items"]["Update"];

export interface BookFormValues {
  title: string;
  author: string;
  isbn10?: string;
  isbn13?: string;
  publisher?: string;
  edition?: string;
  publishedYear?: number | null;
  language?: string;
  category?: string;
  quantity: number;
  purchasePrice?: number | null;
  purchaseDate?: string;
  purchasePlace?: string;
  notes?: string;
  coverFile?: File | null;
  removeCover?: boolean;
}

export interface BulkAddFormValues {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: number | null;
  language?: string;
  category?: string;
  notes?: string;
  coverFile?: File | null;
}

export type LibrarySortOption =
  | "recent"
  | "oldest"
  | "title-asc"
  | "title-desc"
  | "author-asc"
  | "year-desc"
  | "year-asc";

export interface LibraryFilters {
  category?: string;
  language?: string;
  author?: string;
  publishedYear?: number | null;
  search?: string;
}

export type LibraryViewMode = "grid" | "list";

export const PRESET_LANGUAGES = ["Sinhala", "English", "Tamil"] as const;

export const PRESET_CATEGORIES = [
  "Education",
  "Science",
  "Technology",
  "Engineering",
  "Mathematics",
  "Fiction",
  "Non-Fiction",
  "History",
  "Biography",
  "Reference",
  "Children",
  "Religion",
  "Language",
  "Other",
] as const;
