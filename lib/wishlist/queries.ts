import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { WishlistItem, WishlistItemInsert, WishlistItemUpdate, CartItemInsert } from "@/types/shopping";
import { normalizeBookTitle, normalizeAuthorName } from "@/lib/books/normalize";

export interface WishlistDuplicateCheckParams {
  isbn13?: string | null;
  isbn10?: string | null;
  title: string;
  author?: string | null;
}

/**
 * Fetches all wishlist items for a given user, with optional text search.
 */
export async function getWishlistItems(
  supabase: SupabaseClient<Database>,
  userId: string,
  search?: string
): Promise<WishlistItem[]> {
  let query = supabase
    .from("wishlist_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (search && search.trim()) {
    const term = search.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `title.ilike.%${term}%,author.ilike.%${term}%,isbn13.ilike.%${term}%,isbn10.ilike.%${term}%,publisher.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching wishlist items:", error);
    return [];
  }
  return data || [];
}

/**
 * Checks whether an item is already present in the user's wishlist
 * using exact ISBN-13/10 or normalized title + author.
 */
export async function checkWishlistDuplicate(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: WishlistDuplicateCheckParams
): Promise<WishlistItem | null> {
  const { isbn13, isbn10, title, author } = params;

  // 1. Exact ISBN Check
  if (isbn13 || isbn10) {
    const clean13 = isbn13?.trim().replace(/[-\s._]/g, "").toUpperCase();
    const clean10 = isbn10?.trim().replace(/[-\s._]/g, "").toUpperCase();

    const orClauses: string[] = [];
    if (clean13) orClauses.push(`isbn13.eq.${clean13}`);
    if (clean10) orClauses.push(`isbn10.eq.${clean10}`);

    if (orClauses.length > 0) {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("user_id", userId)
        .or(orClauses.join(","))
        .maybeSingle();

      if (!error && data) return data;
    }
  }

  // 2. Title + Author Check
  if (title && title.trim()) {
    const normalizedInputTitle = normalizeBookTitle(title);
    if (!normalizedInputTitle) return null;

    const { data, error } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("user_id", userId);

    if (!error && data) {
      const normalizedInputAuthor = normalizeAuthorName(author);
      for (const item of data) {
        const itemNormTitle = normalizeBookTitle(item.title);
        if (itemNormTitle === normalizedInputTitle) {
          if (!normalizedInputAuthor || !item.author) {
            return item;
          }
          const itemNormAuthor = normalizeAuthorName(item.author);
          if (itemNormAuthor && itemNormAuthor === normalizedInputAuthor) {
            return item;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Adds a new book to the user's wishlist.
 */
export async function addToWishlist(
  supabase: SupabaseClient<Database>,
  item: WishlistItemInsert
): Promise<{ data: WishlistItem | null; error: string | null }> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error("Error adding to wishlist:", error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

/**
 * Updates an existing wishlist item.
 */
export async function updateWishlistItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string,
  updates: WishlistItemUpdate
): Promise<{ data: WishlistItem | null; error: string | null }> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .update(updates)
    .eq("id", itemId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating wishlist item:", error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

/**
 * Removes an item from the user's wishlist.
 */
export async function removeFromWishlist(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing from wishlist:", error);
    return false;
  }
  return true;
}

/**
 * Moves an item from Wishlist to Cart:
 * 1. Inserts into cart_items
 * 2. Removes from wishlist_items
 */
export async function moveWishlistItemToCart(
  supabase: SupabaseClient<Database>,
  userId: string,
  wishlistItem: WishlistItem
): Promise<{ success: boolean; error?: string }> {
  const cartItem: CartItemInsert = {
    user_id: userId,
    title: wishlistItem.title,
    author: wishlistItem.author,
    isbn10: wishlistItem.isbn10,
    isbn13: wishlistItem.isbn13,
    publisher: wishlistItem.publisher,
    edition: wishlistItem.edition,
    published_year: wishlistItem.published_year,
    cover_url: wishlistItem.cover_url,
    source: wishlistItem.source,
    price: wishlistItem.estimated_price,
    quantity: 1,
    seller: null,
    notes: wishlistItem.notes,
  };

  const { error: cartError } = await supabase
    .from("cart_items")
    .insert(cartItem);

  if (cartError) {
    return { success: false, error: cartError.message };
  }

  // Remove from wishlist
  await removeFromWishlist(supabase, userId, wishlistItem.id);
  return { success: true };
}
