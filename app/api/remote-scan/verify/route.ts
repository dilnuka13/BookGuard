import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, token } = body;

    if (!sessionId || !token) {
      return NextResponse.json(
        { success: false, error: "Missing sessionId or token" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Try secure RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_remote_scan_session", {
      p_session_id: sessionId,
      p_token: token,
    });

    if (!rpcError && rpcData) {
      const result = rpcData as {
        success: boolean;
        session_id?: string;
        status?: string;
        device_connected?: boolean;
        expires_at?: string;
        error?: string;
      };

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || "Invalid session or expired",
            status: result.status,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        sessionId: result.session_id,
        status: result.status,
        deviceConnected: result.device_connected,
        expiresAt: result.expires_at,
      });
    }

    // 2. Direct table fallback if RPC is not installed yet
    const { data: row, error: tableError } = await supabase
      .from("remote_scan_sessions")
      .select("id, status, device_connected, expires_at")
      .eq("id", sessionId)
      .eq("session_token", token)
      .single();

    if (tableError || !row) {
      return NextResponse.json(
        { success: false, error: "Session not found or invalid token" },
        { status: 400 }
      );
    }

    const isExpired = new Date(row.expires_at).getTime() < Date.now();
    if (isExpired || row.status === "closed" || row.status === "expired") {
      return NextResponse.json(
        { success: false, error: "Session has expired or closed", status: row.status },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: row.id,
      status: row.status,
      deviceConnected: row.device_connected,
      expiresAt: row.expires_at,
    });
  } catch (err) {
    console.error("Remote scan verify error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
