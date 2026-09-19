import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { MatchResult } from "@/lib/matching/types";

export type ScanHistoryRow = Database["public"]["Tables"]["scan_history"]["Row"];
export type ScanHistoryInsert = Database["public"]["Tables"]["scan_history"]["Insert"];

/**
 * Records a completed book scan into the user's private scan_history table.
 */
export async function recordScanHistory(
  supabase: SupabaseClient<Database>,
  userId: string,
  matchResult: MatchResult
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("scan_history")
      .insert({
        user_id: userId,
        scanned_isbn: matchResult.scannedData.isbn || null,
        detected_title: matchResult.scannedData.title || null,
        detected_author: matchResult.scannedData.author || null,
        detected_publisher: matchResult.scannedData.publisher || null,
        detected_edition: matchResult.scannedData.edition || null,
        cover_hash: matchResult.scannedData.coverHash || null,
        ocr_text: matchResult.scannedData.ocrText ? matchResult.scannedData.ocrText.slice(0, 500) : null,
        match_type: matchResult.result,
        match_confidence: matchResult.confidence,
        matched_library_item_id: matchResult.matchedBook?.id || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to record scan history:", error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error("Exception recording scan history:", err);
    return null;
  }
}

/**
 * Fetches recent scan history for a user.
 */
export async function getRecentScans(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 6
): Promise<ScanHistoryRow[]> {
  const { data, error } = await supabase
    .from("scan_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent scans:", error);
    return [];
  }

  return (data as ScanHistoryRow[]) || [];
}

/**
 * Deletes a single scan history entry belonging to the user.
 */
export async function deleteScanHistoryEntry(
  supabase: SupabaseClient<Database>,
  userId: string,
  scanId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("scan_history")
    .delete()
    .eq("id", scanId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting scan history entry:", error);
    return false;
  }

  return true;
}

/**
 * Clears all scan history entries for the authenticated user.
 */
export async function clearAllScanHistory(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("scan_history")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error clearing scan history:", error);
    return false;
  }

  return true;
}
