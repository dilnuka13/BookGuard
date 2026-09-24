"use client";

import * as React from "react";
import QRCode from "qrcode";
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Copy,
  Check,
  Radio,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatCountdown, getRemainingSeconds } from "@/lib/remote-scan/session";

interface RemoteScanQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

type RemoteSessionStatus = "initializing" | "waiting" | "connected" | "scanned" | "expired" | "closed" | "error";

export function RemoteScanQRModal({
  isOpen,
  onClose,
  onBarcodeScanned,
}: RemoteScanQRModalProps) {
  const [status, setStatus] = React.useState<RemoteSessionStatus>("initializing");
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [expiresAt, setExpiresAt] = React.useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = React.useState<number>(300);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [scanUrl, setScanUrl] = React.useState<string>("");
  const [lastScannedBarcode, setLastScannedBarcode] = React.useState<string | null>(null);
  const [recentScanCount, setRecentScanCount] = React.useState<number>(0);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const supabase = React.useMemo(() => createClient(), []);
  const currentSessionIdRef = React.useRef<string | null>(null);
  currentSessionIdRef.current = sessionId;

  // Cleanup session on server & unsubscribe
  const closeCurrentSession = React.useCallback(async (sid?: string) => {
    const idToClose = sid || currentSessionIdRef.current;
    if (!idToClose) return;

    try {
      // 1. Broadcast session_closed to phone
      const channel = supabase.channel(`remote-scan:${idToClose}`);
      channel.send({
        type: "broadcast",
        event: "session_closed",
        payload: { timestamp: Date.now() },
      });

      // 2. Mark session closed on server
      await fetch("/api/remote-scan/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: idToClose }),
      });
    } catch (err) {
      console.warn("Error closing remote scan session:", err);
    }
  }, [supabase]);

  // Create a new remote scan session
  const createSession = React.useCallback(async () => {
    setStatus("initializing");
    setErrorMessage(null);
    setLastScannedBarcode(null);
    setRecentScanCount(0);
    setQrDataUrl(null);

    // If an existing session was open, close it first
    if (sessionId) {
      await closeCurrentSession(sessionId);
    }

    try {
      const res = await fetch("/api/remote-scan/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create remote scan session");
      }

      setSessionId(data.sessionId);
      setToken(data.token);
      setExpiresAt(data.expiresAt);
      setStatus("waiting");

      // Construct scan URL
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const fullUrl = `${origin}/remote-scan/${data.sessionId}?token=${data.token}`;
      setScanUrl(fullUrl);

      // Generate QR Code locally
      const qrImage = await QRCode.toDataURL(fullUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#09090b", // Rich dark zinc
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(qrImage);
    } catch (err) {
      console.error("Failed to create remote scan session:", err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to create scanner session. Please try again."
      );
    }
  }, [sessionId, closeCurrentSession]);

  // When modal opens, initialize session; when it closes, clean up
  React.useEffect(() => {
    if (isOpen) {
      createSession();
    } else {
      if (currentSessionIdRef.current) {
        closeCurrentSession(currentSessionIdRef.current);
      }
      setStatus("closed");
      setSessionId(null);
      setToken(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Countdown timer
  React.useEffect(() => {
    if (!expiresAt || status === "closed" || status === "expired" || status === "error") {
      return;
    }

    const interval = setInterval(() => {
      const remaining = getRemainingSeconds(expiresAt);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        setStatus("expired");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, status]);

  // Supabase Realtime Listener (Subscribes to Broadcast & DB Updates)
  React.useEffect(() => {
    if (!sessionId || !isOpen) return;

    // 1. Broadcast channel for sub-50ms instant events
    const channel = supabase.channel(`remote-scan:${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "phone_connected" }, () => {
        setStatus("connected");
      })
      .on("broadcast", { event: "barcode_scanned" }, (payload) => {
        const barcode = payload.payload?.barcode;
        if (barcode) {
          setLastScannedBarcode(barcode);
          setRecentScanCount((prev) => prev + 1);
          setStatus("connected");
          onBarcodeScanned(barcode);
        }
      })
      .subscribe();

    // 2. Database table subscription for guaranteed state consistency
    const dbSub = supabase
      .channel(`db-pc-remote-scan:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "remote_scan_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as {
            status: RemoteSessionStatus;
            scanned_value: string | null;
            device_connected: boolean;
          };

          if (row.device_connected && row.status === "connected") {
            setStatus("connected");
          }

          if (row.scanned_value && row.status === "scanned") {
            setLastScannedBarcode(row.scanned_value);
            setRecentScanCount((prev) => prev + 1);
            setStatus("connected");
            onBarcodeScanned(row.scanned_value);
          }

          if (row.status === "expired") {
            setStatus("expired");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(dbSub);
    };
  }, [sessionId, isOpen, supabase, onBarcodeScanned]);

  // Copy scan URL helper
  const handleCopyLink = () => {
    if (!scanUrl) return;
    navigator.clipboard.writeText(scanUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Disconnect phone button
  const handleDisconnect = async () => {
    if (sessionId) {
      await closeCurrentSession(sessionId);
      createSession();
    }
  };

  // Close modal
  const handleClose = () => {
    if (sessionId) {
      closeCurrentSession(sessionId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl text-card-foreground space-y-5 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Scan with Phone
              </h2>
              <p className="text-xs text-muted-foreground">
                Use your smartphone as a wireless barcode scanner
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-muted/50 border border-border/80 text-xs">
          <div className="flex items-center gap-2">
            {status === "initializing" && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-ping" />
                Preparing session...
              </span>
            )}
            {status === "waiting" && (
              <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Waiting for phone...
              </span>
            )}
            {status === "connected" && (
              <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Phone Connected – Ready to scan
              </span>
            )}
            {status === "expired" && (
              <span className="flex items-center gap-1.5 text-destructive font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Session expired
              </span>
            )}
            {status === "error" && (
              <span className="flex items-center gap-1.5 text-destructive font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Session error
              </span>
            )}
          </div>

          {status !== "expired" && status !== "error" && (
            <span className="font-mono text-muted-foreground font-medium">
              Expires: {formatCountdown(remainingSeconds)}
            </span>
          )}
        </div>

        {/* QR Code Card or State Box */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/20 border border-border/60">
          {status === "expired" ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-foreground">Session Timed Out</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                The temporary remote session has expired for your security.
              </p>
              <Button onClick={createSession} className="gap-2 mt-2">
                <RefreshCw className="w-4 h-4" /> Generate New QR
              </Button>
            </div>
          ) : status === "error" ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-foreground">Session Error</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {errorMessage || "Unable to start remote scan session."}
              </p>
              <Button onClick={createSession} className="gap-2 mt-2">
                <RefreshCw className="w-4 h-4" /> Retry
              </Button>
            </div>
          ) : qrDataUrl ? (
            <div className="flex flex-col items-center space-y-3">
              {/* Crisp High-Contrast QR Code container */}
              <div className="p-3 bg-white rounded-2xl shadow-md border border-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Remote Scan QR Code"
                  width={220}
                  height={220}
                  className="rounded-lg aspect-square"
                />
              </div>

              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Scan this QR code using your phone camera. No app installation needed.
              </p>
            </div>
          ) : (
            <div className="w-[220px] h-[220px] flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Live Scan Results / Feedback */}
        {lastScannedBarcode && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider">
                    Last Scanned ISBN
                  </p>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {lastScannedBarcode}
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 font-semibold">
                Auto-Filled ({recentScanCount})
              </span>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              disabled={!scanUrl}
              className="text-xs h-9 gap-1.5 rounded-xl"
              title="Copy scanner link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Copied" : "Copy Link"}</span>
            </Button>

            {scanUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                asChild
                className="text-xs h-9 px-2.5 rounded-xl text-muted-foreground hover:text-foreground"
                title="Test in new tab"
              >
                <a href={scanUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status === "connected" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="text-xs h-9 rounded-xl text-muted-foreground hover:text-destructive"
              >
                Disconnect
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-xs h-9 rounded-xl"
            >
              Close Scanner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
