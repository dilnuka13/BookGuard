import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { filterPresetAuthors, type AuthorSuggestion } from "@/lib/books/authors";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") ?? "";
    const rawLimit = searchParams.get("limit");
    const limit = rawLimit ? Math.min(Math.max(parseInt(rawLimit, 10) || 12, 1), 30) : 12;

    const cleanQuery = rawQuery.trim();

    const supabase = await createClient();
    const suggestions: AuthorSuggestion[] = [];
    const seenNames = new Set<string>();

    // 1. Try secure Postgres RPC function (queries authors across all users' items)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "suggest_authors",
        {
          p_query: cleanQuery,
          p_limit: limit,
        }
      );

      if (!rpcError && Array.isArray(rpcData)) {
        const rows = rpcData as Array<{ author?: string | null; book_count?: number | null }>;
        for (const item of rows) {
          const authorName = (item?.author || "").trim();
          if (authorName && !seenNames.has(authorName.toLowerCase())) {
            seenNames.add(authorName.toLowerCase());
            suggestions.push({
              name: authorName,
              bookCount: Number(item?.book_count) || 1,
              source: "community",
            });
          }
        }
      } else if (rpcError) {
        // Fallback: query library_items table directly if RPC not yet deployed
        const { data: directData } = await supabase
          .from("library_items")
          .select("author")
          .not("author", "is", null)
          .ilike("author", cleanQuery ? `%${cleanQuery}%` : "%")
          .limit(limit * 2);

        if (directData && Array.isArray(directData)) {
          const countMap = new Map<string, number>();
          for (const row of directData) {
            const a = (row.author || "").trim();
            if (a) {
              countMap.set(a, (countMap.get(a) || 0) + 1);
            }
          }
          for (const [authorName, count] of countMap.entries()) {
            if (!seenNames.has(authorName.toLowerCase())) {
              seenNames.add(authorName.toLowerCase());
              suggestions.push({
                name: authorName,
                bookCount: count,
                source: "community",
              });
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn("Database author suggest error, falling back to presets:", dbErr);
    }

    // 2. Blend with curated presets (Sri Lankan & International renowned authors)
    const presetMatches = filterPresetAuthors(cleanQuery, limit);
    for (const preset of presetMatches) {
      if (!seenNames.has(preset.name.toLowerCase())) {
        seenNames.add(preset.name.toLowerCase());
        suggestions.push(preset);
      }
      if (suggestions.length >= limit) break;
    }

    // Return results with client-side caching header
    return NextResponse.json(
      {
        success: true,
        query: cleanQuery,
        authors: suggestions.slice(0, limit),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("Author suggest route error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch author suggestions", authors: [] },
      { status: 500 }
    );
  }
}
