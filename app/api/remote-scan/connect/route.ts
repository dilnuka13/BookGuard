import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, token, deviceInfo } = body;

    if (!sessionId || !token) {
      return NextResponse.json(
        { success: false, error: "Missing sessionId or token" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Try secure RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc("connect_remote_scan_session", {
      p_session_id: sessionId,
      p_token: token,
      p_device_info: deviceInfo || null,
    });

    if (!rpcError && rpcData) {
      const result = rpcData as { success: boolean; status?: string; error?: string };
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Failed to connect" },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        status: result.status || "connected",
      });
    }

    // 2. Direct table fallback
    const { data, error: tableError } = await supabase
      .from("remote_scan_sessions")
      .update({
        status: "connected",
        device_connected: true,
        device_info: deviceInfo || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("session_token", token)
      .select("id, status")
      .single();

    if (tableError || !data) {
      return NextResponse.json(
        { success: false, error: "Session not found or invalid token" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "connected",
    });
  } catch (err) {
    console.error("Remote scan connect error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
