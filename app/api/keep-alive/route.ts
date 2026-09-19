import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Supabase Keep-Alive API Route.
 * Performs a lightweight query against PostgreSQL to reset Supabase's
 * 7-day inactivity pause timer. Can be triggered by GitHub Actions,
 * cron jobs, or in-app heartbeat.
 */
export async function GET() {
  const startTime = Date.now();

  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const latencyMs = Date.now() - startTime;

    if (error) {
      console.error("Supabase keep-alive ping failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "ACTIVE",
      message: "Supabase keep-alive signal delivered successfully. Inactivity timer reset.",
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      latency: `${latencyMs}ms`,
      recordsTracked: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.error("Unexpected keep-alive error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Keep-alive error",
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
