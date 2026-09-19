import type { Database } from "./database.types";

export type WishlistItem = Database["public"]["Tables"]["wishlist_items"]["Row"];
export type WishlistItemInsert = Database["public"]["Tables"]["wishlist_items"]["Insert"];
export type WishlistItemUpdate = Database["public"]["Tables"]["wishlist_items"]["Update"];

export type CartItem = Database["public"]["Tables"]["cart_items"]["Row"];
export type CartItemInsert = Database["public"]["Tables"]["cart_items"]["Insert"];
export type CartItemUpdate = Database["public"]["Tables"]["cart_items"]["Update"];

export type PurchaseHistoryItem = Database["public"]["Tables"]["purchase_history"]["Row"];
export type PurchaseHistoryInsert = Database["public"]["Tables"]["purchase_history"]["Insert"];

export interface PurchaseInput {
  cartItemId: string;
  purchaseDate?: string;
  price?: number | null;
  quantity?: number;
  seller?: string | null;
  notes?: string | null;
}

export interface PurchaseResult {
  success: boolean;
  libraryItemId?: string;
  purchaseHistoryId?: string;
  isExistingCopy?: boolean;
  error?: string;
}

export interface BudgetSummary {
  budget: number | null;
  cartTotal: number;
  remaining: number | null;
  isOverBudget: boolean;
  pricedItemCount: number;
  unpricedItemCount: number;
}

export interface OfflineLibraryItem {
  id: string;
  book_code: string;
  title: string;
  normalized_title: string;
  author: string | null;
  normalized_author: string | null;
  isbn10: string | null;
  isbn13: string | null;
  barcode: string | null;
  edition: string | null;
  publisher: string | null;
  cover_hash: string | null;
  cover_url: string | null;
  updated_at: string;
}

export interface OfflineSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  cachedCount: number;
  error: string | null;
}

export type MutationType = "ADD_TO_WISHLIST" | "ADD_TO_CART";
export type MutationStatus = "PENDING" | "SYNCING" | "FAILED";

export interface WishlistMutationPayload {
  title: string;
  author?: string | null;
  isbn13?: string | null;
  isbn10?: string | null;
  publisher?: string | null;
  edition?: string | null;
  cover_url?: string | null;
  notes?: string | null;
}

export interface CartMutationPayload {
  title: string;
  author?: string | null;
  isbn13?: string | null;
  isbn10?: string | null;
  publisher?: string | null;
  edition?: string | null;
  cover_url?: string | null;
  price?: number | null;
  quantity?: number;
  seller?: string | null;
  notes?: string | null;
}

export interface QueuedMutation {
  id: string;
  type: MutationType;
  payload: WishlistMutationPayload | CartMutationPayload | Record<string, unknown>;
  created_at: string;
  retry_count: number;
  status: MutationStatus;
  last_error?: string;
}
