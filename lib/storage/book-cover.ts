import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export interface UploadCoverResult {
  publicUrl: string;
  storagePath: string;
}

/**
 * Uploads a compressed book cover to Supabase Storage bucket 'book-covers'.
 * Path format: {userId}/{bookId}/cover-{timestamp}.webp
 */
export async function uploadBookCover(
  supabase: SupabaseClient<Database>,
  userId: string,
  bookId: string,
  fileBlob: Blob
): Promise<UploadCoverResult> {
  const storagePath = `${userId}/${bookId}/cover-${Date.now()}.webp`;

  const { data, error } = await supabase.storage
    .from("book-covers")
    .upload(storagePath, fileBlob, {
      contentType: "image/webp",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload book cover: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("book-covers").getPublicUrl(data.path);

  return {
    publicUrl,
    storagePath: data.path,
  };
}

/**
 * Removes a book cover file from Supabase Storage.
 */
export async function deleteBookCover(
  supabase: SupabaseClient<Database>,
  storagePath: string | null | undefined
): Promise<void> {
  if (!storagePath) return;

  try {
    await supabase.storage.from("book-covers").remove([storagePath]);
  } catch (err) {
    console.warn("Could not delete book cover from storage:", err);
  }
}
