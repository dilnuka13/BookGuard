import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  CartItem,
  CartItemInsert,
  CartItemUpdate,
  WishlistItemInsert,
  BudgetSummary,
} from "@/types/shopping";

/**
 * Fetches all cart items for a given user, ordered by creation date.
 */
export async function getCartItems(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching cart items:", error);
    return [];
  }
  return data || [];
}

/**
 * Checks whether an item with an exact ISBN already exists in the cart.
 */
export async function checkCartDuplicate(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: { isbn13?: string | null; isbn10?: string | null }
): Promise<CartItem | null> {
  const { isbn13, isbn10 } = params;
  if (!isbn13 && !isbn10) return null;

  const clean13 = isbn13?.trim().replace(/[-\s._]/g, "").toUpperCase();
  const clean10 = isbn10?.trim().replace(/[-\s._]/g, "").toUpperCase();

  const orClauses: string[] = [];
  if (clean13) orClauses.push(`isbn13.eq.${clean13}`);
  if (clean10) orClauses.push(`isbn10.eq.${clean10}`);

  if (orClauses.length === 0) return null;

  const { data, error } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .or(orClauses.join(","))
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * Adds an item to the user's cart planner.
 */
export async function addToCart(
  supabase: SupabaseClient<Database>,
  item: CartItemInsert
): Promise<{ data: CartItem | null; error: string | null }> {
  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      ...item,
      quantity: Math.max(1, item.quantity || 1),
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding to cart:", error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

/**
 * Updates a cart item's price, quantity, seller, or notes.
 */
export async function updateCartItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string,
  updates: CartItemUpdate
): Promise<{ data: CartItem | null; error: string | null }> {
  const sanitizedUpdates: CartItemUpdate = { ...updates };
  if (sanitizedUpdates.quantity !== undefined) {
    sanitizedUpdates.quantity = Math.max(1, sanitizedUpdates.quantity);
  }
  if (sanitizedUpdates.price !== undefined && sanitizedUpdates.price !== null) {
    sanitizedUpdates.price = Math.max(0, sanitizedUpdates.price);
  }

  const { data, error } = await supabase
    .from("cart_items")
    .update(sanitizedUpdates)
    .eq("id", itemId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating cart item:", error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

/**
 * Removes an item from the user's cart.
 */
export async function removeFromCart(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing from cart:", error);
    return false;
  }
  return true;
}

/**
 * Moves an item from Cart to Wishlist:
 * 1. Inserts into wishlist_items
 * 2. Removes from cart_items
 */
export async function moveCartItemToWishlist(
  supabase: SupabaseClient<Database>,
  userId: string,
  cartItem: CartItem
): Promise<{ success: boolean; error?: string }> {
  const wishlistItem: WishlistItemInsert = {
    user_id: userId,
    title: cartItem.title,
    author: cartItem.author,
    isbn10: cartItem.isbn10,
    isbn13: cartItem.isbn13,
    publisher: cartItem.publisher,
    edition: cartItem.edition,
    published_year: cartItem.published_year,
    cover_url: cartItem.cover_url,
    source: cartItem.source,
    estimated_price: cartItem.price,
    notes: cartItem.notes,
  };

  const { error: wishError } = await supabase
    .from("wishlist_items")
    .insert(wishlistItem);

  if (wishError) {
    return { success: false, error: wishError.message };
  }

  await removeFromCart(supabase, userId, cartItem.id);
  return { success: true };
}

/**
 * Calculates cart totals, accounting for priced and unpriced items.
 * Missing prices do NOT break numeric calculations.
 */
export function calculateCartTotals(
  items: CartItem[],
  budget: number | null = null
): BudgetSummary & { totalQuantity: number } {
  let cartTotal = 0;
  let totalQuantity = 0;
  let pricedItemCount = 0;
  let unpricedItemCount = 0;

  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1);
    totalQuantity += qty;

    if (item.price !== null && !isNaN(Number(item.price)) && Number(item.price) >= 0) {
      cartTotal += Number(item.price) * qty;
      pricedItemCount++;
    } else {
      unpricedItemCount++;
    }
  }

  const remaining = budget !== null ? budget - cartTotal : null;
  const isOverBudget = budget !== null ? cartTotal > budget : false;

  return {
    budget,
    cartTotal,
    remaining,
    isOverBudget,
    pricedItemCount,
    unpricedItemCount,
    totalQuantity,
  };
}

/**
 * Session budget storage helper using localStorage.
 */
const BUDGET_STORAGE_KEY = "bookguard_session_budget";

export function getStoredBudget(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (!val) return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) || parsed < 0 ? null : parsed;
  } catch {
    return null;
  }
}

export function setStoredBudget(budget: number | null): void {
  if (typeof window === "undefined") return;
  try {
    if (budget === null || budget <= 0) {
      localStorage.removeItem(BUDGET_STORAGE_KEY);
    } else {
      localStorage.setItem(BUDGET_STORAGE_KEY, budget.toString());
    }
  } catch {
    // Ignore localStorage errors
  }
}
