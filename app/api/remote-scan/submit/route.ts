import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, token, barcode } = body;

    if (!sessionId || !token || !barcode) {
      return NextResponse.json(
        { success: false, error: "Missing sessionId, token, or barcode" },
        { status: 400 }
      );
    }

    const cleanBarcode = String(barcode).trim();
    if (!cleanBarcode) {
      return NextResponse.json(
        { success: false, error: "Barcode cannot be empty" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Try secure RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc("submit_remote_scan_barcode", {
      p_session_id: sessionId,
      p_token: token,
      p_barcode: cleanBarcode,
    });

    if (!rpcError && rpcData) {
      const result = rpcData as {
        success: boolean;
        scanned_value?: string;
        status?: string;
        error?: string;
      };

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Submission rejected" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        scannedValue: result.scanned_value,
        status: result.status,
      });
    }

    // 2. Direct table fallback
    const { data, error: tableError } = await supabase
      .from("remote_scan_sessions")
      .update({
        scanned_value: cleanBarcode,
        status: "scanned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("session_token", token)
      .select("id, scanned_value, status")
      .single();

    if (tableError || !data) {
      return NextResponse.json(
        { success: false, error: "Failed to update barcode in database" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      scannedValue: data.scanned_value,
      status: data.status,
    });
  } catch (err) {
    console.error("Remote scan submit error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
