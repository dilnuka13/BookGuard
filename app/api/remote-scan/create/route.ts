import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSecureToken } from "@/lib/remote-scan/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in on desktop" },
        { status: 401 }
      );
    }

    const token = generateSecureToken(24);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    const { data, error } = await supabase
      .from("remote_scan_sessions")
      .insert({
        user_id: user.id,
        session_token: token,
        status: "waiting",
        device_connected: false,
        expires_at: expiresAt,
      })
      .select("id, expires_at")
      .single();

    if (error || !data) {
      console.error("Failed to create remote scan session:", error);
      return NextResponse.json(
        { success: false, error: "Database error creating session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: data.id,
      token,
      expiresAt: data.expires_at,
    });
  } catch (err) {
    console.error("Remote scan create error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
