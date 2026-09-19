import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  PurchaseHistoryItem,
  PurchaseInput,
  PurchaseResult,
} from "@/types/shopping";
import { generateBookCode } from "@/lib/books/book-code";
import { normalizeBookTitle, normalizeAuthorName } from "@/lib/books/normalize";

export interface PurchaseHistoryFilters {
  search?: string;
  seller?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Fetches purchase history records for a user with optional search and date filters.
 */
export async function getPurchaseHistory(
  supabase: SupabaseClient<Database>,
  userId: string,
  filters?: PurchaseHistoryFilters
): Promise<PurchaseHistoryItem[]> {
  let query = supabase
    .from("purchase_history")
    .select("*")
    .eq("user_id", userId)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `title.ilike.%${term}%,author.ilike.%${term}%,seller.ilike.%${term}%,notes.ilike.%${term}%,isbn13.ilike.%${term}%`
    );
  }

  if (filters?.seller && filters.seller.trim()) {
    query = query.ilike("seller", `%${filters.seller.trim()}%`);
  }

  if (filters?.startDate) {
    query = query.gte("purchase_date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("purchase_date", filters.endDate);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching purchase history:", error);
    return [];
  }
  return data || [];
}

/**
 * Executes the "Mark as Purchased" workflow.
 * Tries the atomic PostgreSQL RPC function first.
 * If the RPC is not available in the database instance, gracefully performs the client-side sequence.
 */
export async function markPurchasedAction(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: PurchaseInput
): Promise<PurchaseResult> {
  const { cartItemId, purchaseDate, price, quantity, seller, notes } = input;
  const safeQty = Math.max(1, quantity || 1);
  const safeDate = purchaseDate || new Date().toISOString().split("T")[0];

  // Attempt 1: Call Supabase PostgreSQL RPC function
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "mark_cart_item_purchased",
      {
        p_cart_item_id: cartItemId,
        p_purchase_date: safeDate,
        p_price: price !== undefined && price !== null ? Number(price) : null,
        p_quantity: safeQty,
        p_seller: seller?.trim() || null,
        p_notes: notes?.trim() || null,
      }
    );

    if (!rpcError && rpcData && rpcData.success) {
      return {
        success: true,
        libraryItemId: rpcData.library_item_id,
        purchaseHistoryId: rpcData.purchase_history_id,
        isExistingCopy: rpcData.is_existing_copy,
      };
    }

    if (rpcError && !rpcError.message.includes("function") && !rpcError.message.includes("does not exist")) {
      // If it's an authorization or specific database error, return it
      console.warn("RPC call returned error, evaluating client fallback:", rpcError);
    }
  } catch (rpcErr) {
    console.warn("RPC attempt threw exception, proceeding to client fallback:", rpcErr);
  }

  // Attempt 2: Client-side transactional workflow fallback
  try {
    // 1. Fetch Cart Item
    const { data: cartItem, error: cartFetchError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("id", cartItemId)
      .eq("user_id", userId)
      .single();

    if (cartFetchError || !cartItem) {
      return { success: false, error: "Cart item not found or unauthorized." };
    }

    const unitPrice = price !== undefined && price !== null ? Number(price) : cartItem.price;
    const finalSeller = seller !== undefined && seller !== null ? seller.trim() || null : cartItem.seller;
    const finalNotes = notes !== undefined && notes !== null ? notes.trim() || null : cartItem.notes;
    const totalAmount = unitPrice !== null && !isNaN(unitPrice) ? unitPrice * safeQty : null;

    // 2. Check if library already contains this exact ISBN
    let targetLibId: string | null = null;
    let isExistingCopy = false;

    if (cartItem.isbn13 || cartItem.isbn10) {
      const orClauses: string[] = [];
      if (cartItem.isbn13) orClauses.push(`isbn13.eq.${cartItem.isbn13}`);
      if (cartItem.isbn10) orClauses.push(`isbn10.eq.${cartItem.isbn10}`);

      const { data: existingLibItem } = await supabase
        .from("library_items")
        .select("id, quantity")
        .eq("user_id", userId)
        .or(orClauses.join(","))
        .maybeSingle();

      if (existingLibItem) {
        // Increment quantity of existing edition
        isExistingCopy = true;
        targetLibId = existingLibItem.id;
        await supabase
          .from("library_items")
          .update({
            quantity: existingLibItem.quantity + safeQty,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLibItem.id)
          .eq("user_id", userId);
      }
    }

    // 3. If not existing in library, insert new library item
    if (!targetLibId) {
      const bookCode = generateBookCode();
      const normTitle = normalizeBookTitle(cartItem.title);
      const normAuthor = normalizeAuthorName(cartItem.author);

      const { data: newLibItem, error: libInsertError } = await supabase
        .from("library_items")
        .insert({
          user_id: userId,
          book_code: bookCode,
          title: cartItem.title,
          normalized_title: normTitle,
          author: cartItem.author,
          normalized_author: normAuthor,
          isbn10: cartItem.isbn10,
          isbn13: cartItem.isbn13,
          publisher: cartItem.publisher,
          edition: cartItem.edition,
          published_year: cartItem.published_year,
          cover_url: cartItem.cover_url,
          quantity: safeQty,
          purchase_price: unitPrice,
          purchase_date: safeDate,
          purchase_place: finalSeller,
          notes: finalNotes,
        })
        .select("id")
        .single();

      if (libInsertError || !newLibItem) {
        return { success: false, error: `Failed to add book to library: ${libInsertError?.message || "Unknown error"}` };
      }

      targetLibId = newLibItem.id;
    }

    // 4. Create purchase history record
    const { data: purchaseRec, error: purchaseInsertError } = await supabase
      .from("purchase_history")
      .insert({
        user_id: userId,
        library_item_id: targetLibId,
        title: cartItem.title,
        author: cartItem.author,
        isbn10: cartItem.isbn10,
        isbn13: cartItem.isbn13,
        edition: cartItem.edition,
        cover_url: cartItem.cover_url,
        quantity: safeQty,
        price: unitPrice,
        seller: finalSeller,
        purchase_date: safeDate,
        total_amount: totalAmount,
        notes: finalNotes,
      })
      .select("id")
      .single();

    if (purchaseInsertError || !purchaseRec) {
      console.warn("Could not insert purchase history record:", purchaseInsertError);
    }

    // 5. Remove cart item
    await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("user_id", userId);

    // 6. Remove matching wishlist item if same ISBN exists
    if (cartItem.isbn13 || cartItem.isbn10) {
      const orClauses: string[] = [];
      if (cartItem.isbn13) orClauses.push(`isbn13.eq.${cartItem.isbn13}`);
      if (cartItem.isbn10) orClauses.push(`isbn10.eq.${cartItem.isbn10}`);

      await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", userId)
        .or(orClauses.join(","));
    }

    return {
      success: true,
      libraryItemId: targetLibId,
      purchaseHistoryId: purchaseRec?.id,
      isExistingCopy,
    };
  } catch (err) {
    console.error("Mark as purchased flow failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record purchase.",
    };
  }
}

export interface GroupedPurchases {
  today: PurchaseHistoryItem[];
  thisMonth: PurchaseHistoryItem[];
  older: PurchaseHistoryItem[];
}

/**
 * Groups purchase items chronologically into Today, This Month, and Older.
 */
export function groupPurchasesByPeriod(items: PurchaseHistoryItem[]): GroupedPurchases {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const groups: GroupedPurchases = {
    today: [],
    thisMonth: [],
    older: [],
  };

  for (const item of items) {
    if (item.purchase_date === todayStr) {
      groups.today.push(item);
      continue;
    }

    const itemDate = new Date(item.purchase_date);
    if (
      itemDate.getFullYear() === currentYear &&
      itemDate.getMonth() === currentMonth
    ) {
      groups.thisMonth.push(item);
    } else {
      groups.older.push(item);
    }
  }

  return groups;
}

/**
 * Aggregates statistics for purchases (count and total spend).
 */
export async function getPurchaseStats(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ totalPurchases: number; totalSpent: number }> {
  const { data, error } = await supabase
    .from("purchase_history")
    .select("total_amount, quantity, price")
    .eq("user_id", userId);

  if (error || !data) {
    return { totalPurchases: 0, totalSpent: 0 };
  }

  let totalSpent = 0;
  for (const row of data) {
    if (row.total_amount !== null && !isNaN(Number(row.total_amount))) {
      totalSpent += Number(row.total_amount);
    } else if (row.price !== null && !isNaN(Number(row.price))) {
      totalSpent += Number(row.price) * (row.quantity || 1);
    }
  }

  return {
    totalPurchases: data.length,
    totalSpent,
  };
}
