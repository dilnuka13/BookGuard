import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { WishlistMutationPayload, CartMutationPayload } from "@/types/shopping";
import {
  getPendingMutations,
  updateMutationStatus,
  removeMutation,
  getMutationQueueCount,
} from "./db";
import { addToWishlist, checkWishlistDuplicate } from "@/lib/wishlist/queries";
import { addToCart, checkCartDuplicate } from "@/lib/cart/queries";

export interface SyncQueueResult {
  processed: number;
  succeeded: number;
  failed: number;
}

/**
 * Replays all queued offline safe mutations (Add to Wishlist, Add to Cart) sequentially.
 * Runs on network recovery with duplicate protection.
 */
export async function processMutationQueue(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SyncQueueResult> {
  const pending = await getPendingMutations();

  if (!pending || pending.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const mutation of pending) {
    // Avoid hammering with permanently failing records
    if (mutation.retry_count >= 5) {
      failed++;
      continue;
    }

    try {
      await updateMutationStatus(mutation.id, "SYNCING");

      if (mutation.type === "ADD_TO_WISHLIST") {
        const payload = mutation.payload as WishlistMutationPayload;

        // Verify duplicate before inserting
        const isDup = await checkWishlistDuplicate(supabase, userId, {
          isbn13: payload.isbn13 || null,
          isbn10: payload.isbn10 || null,
          title: payload.title || "",
          author: payload.author || null,
        });

        if (isDup) {
          // Already on shelf, safe removal
          await removeMutation(mutation.id);
          succeeded++;
          continue;
        }

        const { error } = await addToWishlist(supabase, {
          user_id: userId,
          title: payload.title,
          author: payload.author || null,
          isbn13: payload.isbn13 || null,
          isbn10: payload.isbn10 || null,
          publisher: payload.publisher || null,
          edition: payload.edition || null,
          cover_url: payload.cover_url || null,
          notes: payload.notes || null,
        });

        if (error) {
          await updateMutationStatus(mutation.id, "FAILED", error || "Add to wishlist failed");
          failed++;
        } else {
          await removeMutation(mutation.id);
          succeeded++;
        }
      } else if (mutation.type === "ADD_TO_CART") {
        const payload = mutation.payload as CartMutationPayload;

        // Verify duplicate in cart
        const isDup = await checkCartDuplicate(supabase, userId, {
          isbn13: payload.isbn13 || null,
          isbn10: payload.isbn10 || null,
        });

        if (isDup) {
          // Already in cart, safe removal
          await removeMutation(mutation.id);
          succeeded++;
          continue;
        }

        const { error } = await addToCart(supabase, {
          user_id: userId,
          title: payload.title,
          author: payload.author || null,
          isbn13: payload.isbn13 || null,
          isbn10: payload.isbn10 || null,
          publisher: payload.publisher || null,
          edition: payload.edition || null,
          cover_url: payload.cover_url || null,
          price: payload.price ?? null,
          quantity: payload.quantity ?? 1,
          seller: payload.seller || null,
          notes: payload.notes || null,
        });

        if (error) {
          await updateMutationStatus(mutation.id, "FAILED", error || "Add to cart failed");
          failed++;
        } else {
          await removeMutation(mutation.id);
          succeeded++;
        }
      }
    } catch (err) {
      console.warn("Queue replay error for item:", mutation.id, err);
      await updateMutationStatus(
        mutation.id,
        "FAILED",
        err instanceof Error ? err.message : "Sync error"
      );
      failed++;
    }
  }

  return {
    processed: pending.length,
    succeeded,
    failed,
  };
}

export { getMutationQueueCount };
