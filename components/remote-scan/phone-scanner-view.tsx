"use client";

import * as React from "react";
import {
  Camera,
  AlertCircle,
  RefreshCw,
  Zap,
  ZapOff,
  FlipHorizontal,
  CheckCircle2,
  Wifi,
  WifiOff,
  Smartphone,
  Laptop,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { playScanSuccessTone, triggerHapticFeedback, initAudio } from "@/lib/remote-scan/feedback";
import { normalizeISBN } from "@/lib/isbn/normalize";
import type { IScannerControls } from "@zxing/browser";

interface PhoneScannerViewProps {
  sessionId: string;
  token: string;
}

type PhoneState =
  | "verifying"
  | "ready_to_start"
  | "camera_active"
  | "error"
  | "expired"
  | "closed";

export function PhoneScannerView({ sessionId, token }: PhoneScannerViewProps) {
  const [state, setState] = React.useState<PhoneState>("verifying");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isConnectedToPC, setIsConnectedToPC] = React.useState(false);
  const [lastScannedCode, setLastScannedCode] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [scanSuccessFeedback, setScanSuccessFeedback] = React.useState(false);

  // Camera & Device states
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const zxingControlsRef = React.useRef<IScannerControls | null>(null);
  const animationFrameIdRef = React.useRef<number | null>(null);
  const scanLockRef = React.useRef(false);

  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = React.useState<string | undefined>(undefined);
  const [torchAvailable, setTorchAvailable] = React.useState(false);
  const [isTorchOn, setIsTorchOn] = React.useState(false);

  const supabase = React.useMemo(() => createClient(), []);

  // Stop camera tracks cleanly
  const stopTracks = React.useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (zxingControlsRef.current) {
      try {
        zxingControlsRef.current.stop();
      } catch (err) {
        console.warn("ZXing stop error:", err);
      }
      zxingControlsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn("Error stopping track:", err);
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // 1. Initial verification of session & token
  const verifySession = React.useCallback(async () => {
    setState("verifying");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/remote-scan/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, token }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.status === "closed") {
          setState("closed");
        } else if (data.status === "expired") {
          setState("expired");
        } else {
          setErrorMessage(data.error || "Invalid session or token");
          setState("error");
        }
        return;
      }

      setState("ready_to_start");
    } catch (err) {
      console.error("Failed to verify session:", err);
      setErrorMessage("Could not connect to server. Please check internet connection.");
      setState("error");
    }
  }, [sessionId, token]);

  React.useEffect(() => {
    verifySession();
  }, [verifySession]);

  // 2. Realtime listener for desktop actions (e.g. PC closing the session)
  React.useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`remote-scan:${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "session_closed" }, () => {
        stopTracks();
        setState("closed");
      })
      .on("broadcast", { event: "ping" }, () => {
        setIsConnectedToPC(true);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Send join broadcast
          channel.send({
            type: "broadcast",
            event: "phone_joined",
            payload: { timestamp: Date.now() },
          });
        }
      });

    // Also listen to postgres_changes on remote_scan_sessions for this session ID
    const dbSub = supabase
      .channel(`db-remote-scan:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "remote_scan_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newStatus = payload.new?.status;
          if (newStatus === "closed") {
            stopTracks();
            setState("closed");
          } else if (newStatus === "expired") {
            stopTracks();
            setState("expired");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(dbSub);
    };
  }, [sessionId, supabase, stopTracks]);

  // 3. Start camera stream
  const startCamera = React.useCallback(
    async (deviceId?: string) => {
      stopTracks();
      setErrorMessage(null);
      initAudio();

      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setErrorMessage(
          "Camera access is not supported on this browser or connection. HTTPS is required."
        );
        setState("error");
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        if (track) {
          try {
            const capabilities = (
              track as unknown as { getCapabilities?: () => { torch?: boolean } }
            ).getCapabilities?.();
            setTorchAvailable(!!capabilities?.torch);
          } catch {
            setTorchAvailable(false);
          }
        }

        // Enumerate devices
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
          setDevices(videoInputs);

          const currentTrack = stream.getVideoTracks()[0];
          const settings = currentTrack?.getSettings();
          if (settings?.deviceId) {
            setCurrentDeviceId(settings.deviceId);
          }
        } catch (e) {
          console.warn("Could not enumerate devices:", e);
        }

        // Notify server that phone is connected
        const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
        fetch("/api/remote-scan/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            token,
            deviceInfo: userAgent.slice(0, 100),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setIsConnectedToPC(true);
            }
          })
          .catch((err) => console.warn("Failed to notify connect:", err));

        // Broadcast to desktop channel
        const ch = supabase.channel(`remote-scan:${sessionId}`);
        ch.send({
          type: "broadcast",
          event: "phone_connected",
          payload: { timestamp: Date.now() },
        });

        setState("camera_active");
      } catch (err) {
        console.error("Camera access error:", err);
        let errorText = "Unable to access phone camera.";
        if (err instanceof DOMException) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            errorText = "Camera permission was denied. Please allow camera access in your browser.";
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            errorText = "No camera found on this device.";
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            errorText = "Camera is already in use by another application.";
          }
        }
        setErrorMessage(errorText);
        setState("error");
      }
    },
    [sessionId, token, supabase, stopTracks]
  );

  // Switch camera if multiple exist
  const switchCamera = React.useCallback(() => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    if (nextDevice) {
      startCamera(nextDevice.deviceId);
    }
  }, [devices, currentDeviceId, startCamera]);

  // Toggle torch/flashlight
  const toggleTorch = React.useCallback(async () => {
    if (!streamRef.current || !torchAvailable) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !isTorchOn;
      await (
        track as MediaStreamTrack & { applyConstraints: (c: unknown) => Promise<void> }
      ).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn("Torch toggle error:", err);
    }
  }, [isTorchOn, torchAvailable]);

  // Handle scanned barcode submission
  const handleBarcodeDetected = React.useCallback(
    async (rawCode: string) => {
      if (scanLockRef.current) return;

      const cleanCode = normalizeISBN(rawCode) || rawCode.trim();
      if (!cleanCode || cleanCode.length < 4) return;

      // Lock to debounce duplicate scans (2.5 seconds lock)
      scanLockRef.current = true;
      setIsSubmitting(true);
      setLastScannedCode(cleanCode);

      // Audio & Haptic feedback immediately
      playScanSuccessTone();
      triggerHapticFeedback();
      setScanSuccessFeedback(true);

      setTimeout(() => {
        setScanSuccessFeedback(false);
      }, 2000);

      try {
        // 1. Send via Supabase Realtime Broadcast for instant (sub-50ms) desktop receipt
        const ch = supabase.channel(`remote-scan:${sessionId}`);
        ch.send({
          type: "broadcast",
          event: "barcode_scanned",
          payload: {
            barcode: cleanCode,
            timestamp: Date.now(),
          },
        });

        // 2. Persist in database via secure RPC endpoint
        const res = await fetch("/api/remote-scan/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            token,
            barcode: cleanCode,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.status === "expired") {
            setState("expired");
            stopTracks();
            return;
          }
          if (data.status === "closed") {
            setState("closed");
            stopTracks();
            return;
          }
        }
      } catch (err) {
        console.error("Barcode submission error:", err);
      } finally {
        setIsSubmitting(false);
        // Release debounce lock after 2.5s for continuous scanning of the next book!
        setTimeout(() => {
          scanLockRef.current = false;
        }, 2500);
      }
    },
    [sessionId, token, supabase, stopTracks]
  );

  // Barcode scanning engine (Native BarcodeDetector + ZXing fallback)
  React.useEffect(() => {
    if (state !== "camera_active" || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    let isActive = true;

    const HasNativeBarcode = typeof window !== "undefined" && "BarcodeDetector" in window;

    if (HasNativeBarcode) {
      try {
        const BarcodeDetectorClass = (
          window as unknown as {
            BarcodeDetector: new (opts: unknown) => {
              detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
            };
          }
        ).BarcodeDetector;

        const detector = new BarcodeDetectorClass({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });

        const scanLoop = async () => {
          if (!isActive || !video || video.readyState < 2) {
            if (isActive) {
              animationFrameIdRef.current = requestAnimationFrame(scanLoop);
            }
            return;
          }

          try {
            const barcodes = await detector.detect(video);
            if (barcodes && barcodes.length > 0 && isActive) {
              const rawValue = barcodes[0].rawValue;
              if (rawValue && !scanLockRef.current) {
                handleBarcodeDetected(rawValue);
              }
            }
          } catch {
            // Ignore temporary frame detection failures
          }

          if (isActive) {
            animationFrameIdRef.current = requestAnimationFrame(scanLoop);
          }
        };

        animationFrameIdRef.current = requestAnimationFrame(scanLoop);

        return () => {
          isActive = false;
          if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
          }
        };
      } catch (nativeErr) {
        console.warn("Native BarcodeDetector error, falling back to ZXing:", nativeErr);
      }
    }

    // ZXing Fallback
    let isCancelled = false;
    (async () => {
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
          await Promise.all([
            import("@zxing/browser"),
            import("@zxing/library"),
          ]);

        if (isCancelled || !isActive || !video) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ]);

        const codeReader = new BrowserMultiFormatReader(hints);

        codeReader
          .decodeFromVideoElement(video, (result, err, controls) => {
            zxingControlsRef.current = controls;
            if (result && isActive && !scanLockRef.current) {
              const text = result.getText();
              if (text) {
                handleBarcodeDetected(text);
              }
            }
          })
          .catch((zxingErr) => {
            console.warn("ZXing decode error:", zxingErr);
          });
      } catch (err) {
        console.warn("Failed to load ZXing:", err);
      }
    })();

    return () => {
      isCancelled = true;
      isActive = false;
      if (zxingControlsRef.current) {
        zxingControlsRef.current.stop();
        zxingControlsRef.current = null;
      }
    };
  }, [state, handleBarcodeDetected]);

  // Clean up on component unmount
  React.useEffect(() => {
    return () => {
      stopTracks();
    };
  }, [stopTracks]);

  // ----------------------------------------------------
  // Render: Verifying state
  // ----------------------------------------------------
  if (state === "verifying") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 animate-pulse">
          <Smartphone className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
          Connecting to BookGuard...
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          Validating your secure scanner session.
        </p>
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Expired state
  // ----------------------------------------------------
  if (state === "expired") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
          Session Expired
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          This remote scanner session has timed out. Please click &ldquo;Generate New QR&rdquo; on your desktop BookGuard screen.
        </p>
        <Button onClick={verifySession} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Try Again
        </Button>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Closed state
  // ----------------------------------------------------
  if (state === "closed") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center mb-6 text-muted-foreground">
          <Laptop className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
          Scanner Closed
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          The scanner was closed by your desktop BookGuard application. You can safely close this browser tab.
        </p>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Error state
  // ----------------------------------------------------
  if (state === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6 text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
          Connection Failed
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          {errorMessage || "Unable to start the scanner session."}
        </p>
        <Button onClick={verifySession} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </Button>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Permission / Ready to Start Screen
  // ----------------------------------------------------
  if (state === "ready_to_start") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 max-w-md mx-auto">
        <div className="w-full flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              BG
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">
              BookGuard Remote Scanner
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected to PC
          </span>
        </div>

        <div className="flex flex-col items-center text-center my-auto py-8">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary shadow-inner">
            <Camera className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
            Ready to Scan Books
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
            Use your phone&apos;s rear camera to scan book ISBN barcodes directly into your desktop BookGuard library.
          </p>

          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold shadow-lg shadow-primary/25 rounded-2xl gap-2"
            onClick={() => startCamera()}
          >
            <Camera className="w-5 h-5" /> Start Camera
          </Button>
        </div>

        <div className="w-full pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            No app installation required. Works directly in your mobile browser.
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Active Mobile Camera Scanner Screen
  // ----------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden select-none">
      {/* Video Viewport */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Top Header Overlay */}
      <div className="relative z-10 p-4 pt-safe flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected to PC
          </span>
        </div>

        <div className="flex items-center gap-2">
          {torchAvailable && (
            <button
              onClick={toggleTorch}
              className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${
                isTorchOn
                  ? "bg-amber-400 text-black border-amber-300 shadow-lg shadow-amber-400/30"
                  : "bg-black/60 text-white border-white/20 hover:bg-black/80"
              }`}
              title="Toggle Flashlight"
            >
              {isTorchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          {devices.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-all"
              title="Flip Camera"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Center Viewfinder Framing */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div
          className={`relative w-full max-w-xs aspect-[4/3] rounded-2xl border-2 transition-all duration-300 ${
            scanSuccessFeedback
              ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.5)] scale-105"
              : "border-white/50 bg-transparent shadow-2xl"
          }`}
        >
          {/* Viewfinder Corner Accents */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

          {/* Animated Red Laser Scan Line */}
          {!scanSuccessFeedback && (
            <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
          )}

          {/* Center Guide Label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-medium text-white/70 tracking-wider uppercase px-2.5 py-1 rounded bg-black/40 backdrop-blur-sm">
              Point at ISBN / Barcode
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-white/80 text-center drop-shadow-md">
          Continuous mode active. Point at any book barcode.
        </p>
      </div>

      {/* Bottom Live Feedback Dock (Safe-area padded) */}
      <div className="relative z-10 p-5 pb-safe bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        {lastScannedCode ? (
          <div
            className={`p-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
              scanSuccessFeedback
                ? "bg-emerald-950/80 border-emerald-500/50 text-white"
                : "bg-zinc-900/80 border-white/10 text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  scanSuccessFeedback ? "bg-emerald-500 text-black" : "bg-primary/20 text-primary"
                }`}
              >
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  ✓ ISBN Sent to BookGuard
                </p>
                <p className="font-mono text-base font-bold tracking-tight truncate">
                  {lastScannedCode}
                </p>
              </div>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
              <span>Ready for next scan...</span>
              <span className="text-[10px] uppercase font-semibold text-emerald-400">Continuous</span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-center">
            <p className="text-xs text-white/75">
              Supports EAN-13, EAN-8, and UPC book barcodes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
