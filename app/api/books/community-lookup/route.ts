import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeISBN } from "@/lib/isbn/normalize";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawIsbn = searchParams.get("isbn");

    if (!rawIsbn) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'isbn' is required" },
        { status: 400 }
      );
    }

    const cleanIsbn = normalizeISBN(rawIsbn);
    if (!cleanIsbn) {
      return NextResponse.json(
        { success: false, error: "Invalid ISBN format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Try secure RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "lookup_community_book_by_isbn",
      { p_isbn: cleanIsbn }
    );

    if (!rpcError && rpcData) {
      const result = rpcData as {
        found: boolean;
        title: string;
        author?: string | null;
        publisher?: string | null;
        edition?: string | null;
        published_year?: number | null;
        language?: string | null;
        category?: string | null;
        cover_url?: string | null;
        cover_hash?: string | null;
        isbn13?: string | null;
        isbn10?: string | null;
      };

      if (result.found && result.title) {
        return NextResponse.json({
          success: true,
          found: true,
          book: result,
        });
      }
    }

    return NextResponse.json({
      success: true,
      found: false,
      message: "No community metadata found for this ISBN yet.",
    });
  } catch (err) {
    console.error("Community lookup error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to perform community lookup" },
      { status: 500 }
    );
  }
}
