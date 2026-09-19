"use client";

import * as React from "react";
import type { IScannerControls } from "@zxing/browser";
import { Camera, AlertCircle, RefreshCw, Zap, ZapOff, FlipHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraViewProps {
  onBarcodeDetected: (barcode: string) => void;
  isScanning: boolean;
  onCameraReady?: () => void;
  onError?: (error: string) => void;
  onCaptureFrame?: (canvas: HTMLCanvasElement) => void;
}

export function CameraView({
  onBarcodeDetected,
  isScanning,
  onCameraReady,
  onError,
}: CameraViewProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const zxingControlsRef = React.useRef<IScannerControls | null>(null);
  const animationFrameIdRef = React.useRef<number | null>(null);

  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = React.useState<string | undefined>(undefined);
  const [torchAvailable, setTorchAvailable] = React.useState(false);
  const [isTorchOn, setIsTorchOn] = React.useState(false);

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
        console.warn("Error stopping ZXing controls:", err);
      }
      zxingControlsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn("Error stopping media track:", err);
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera stream
  const startCamera = React.useCallback(async (deviceId?: string) => {
    stopTracks();
    setErrorMessage(null);

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setHasPermission(false);
      const msg = "Camera access is not supported on this browser or connection. HTTPS is required.";
      setErrorMessage(msg);
      onError?.(msg);
      return;
    }

    try {
      // Find back/environment camera by default
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
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (
            track as unknown as { getCapabilities?: () => { torch?: boolean } }
          ).getCapabilities?.();
          if (capabilities?.torch) {
            setTorchAvailable(true);
          }
        } catch {
          setTorchAvailable(false);
        }
      }

      // Enumerate other cameras for switching
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoInputs);

        const currentTrack = stream.getVideoTracks()[0];
        const currentSettings = currentTrack?.getSettings();
        if (currentSettings?.deviceId) {
          setCurrentDeviceId(currentSettings.deviceId);
        }
      } catch (e) {
        console.warn("Failed to enumerate media devices:", e);
      }

      onCameraReady?.();
    } catch (err) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      let errorText = "Unable to access camera. Please check browser permissions.";
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorText = "Camera permission was denied. Please allow camera access in your browser settings.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorText = "No camera found on this device.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorText = "Camera is already in use by another application.";
        }
      }
      setErrorMessage(errorText);
      onError?.(errorText);
    }
  }, [stopTracks, onCameraReady, onError]);

  // Handle Torch Toggle
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
      console.warn("Failed to toggle torch:", err);
    }
  }, [isTorchOn, torchAvailable]);

  // Switch Camera
  const switchCamera = React.useCallback(() => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    if (nextDevice) {
      startCamera(nextDevice.deviceId);
    }
  }, [devices, currentDeviceId, startCamera]);

  // Continuous Barcode Scanning Engine
  React.useEffect(() => {
    if (!isScanning || !hasPermission || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    let isActive = true;

    // Check for native BarcodeDetector API first (standard in modern Chromium & iOS 17+)
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
              if (rawValue) {
                onBarcodeDetected(rawValue);
                return;
              }
            }
          } catch {
            // Ignore frame detection hiccups
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
        console.warn("Native BarcodeDetector initialization failed, falling back to ZXing:", nativeErr);
      }
    }

    // ZXing Fallback (lazy loaded only if native BarcodeDetector is absent)
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
            if (result && isActive) {
              const text = result.getText();
              if (text) {
                onBarcodeDetected(text);
              }
            }
          })
          .catch((zxingErr) => {
            console.warn("ZXing scanner loop error:", zxingErr);
          });
      } catch (err) {
        console.warn("Failed to load ZXing fallback libraries:", err);
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
  }, [isScanning, hasPermission, onBarcodeDetected]);

  // Initial camera mount
  React.useEffect(() => {
    startCamera();
    return () => {
      stopTracks();
    };
  }, [startCamera, stopTracks]);

  return (
    <div className="relative w-full h-full min-h-[420px] bg-black overflow-hidden flex items-center justify-center">
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="w-full h-full object-cover select-none"
      />

      {/* Camera Controls Overlay (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {torchAvailable && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTorch}
            aria-label={isTorchOn ? "Turn off torch" : "Turn on torch"}
            className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md border border-white/20 shadow-md"
          >
            {isTorchOn ? <Zap className="h-5 w-5 text-amber-400 fill-amber-400" /> : <ZapOff className="h-5 w-5" />}
          </Button>
        )}

        {devices.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={switchCamera}
            aria-label="Switch camera"
            className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md border border-white/20 shadow-md"
          >
            <FlipHorizontal className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Camera Error / Permission Denied State */}
      {hasPermission === false && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20 text-destructive mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold">Camera Unavailable</h3>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
            {errorMessage || "Please grant camera permissions to scan book barcodes directly."}
          </p>
          <div className="mt-5 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startCamera()}
              className="gap-1.5 border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Permission</span>
            </Button>
          </div>
        </div>
      )}

      {/* Camera Initializing State */}
      {hasPermission === null && (
        <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center text-white">
          <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
          <p className="text-sm font-medium">Connecting to camera...</p>
        </div>
      )}
    </div>
  );
}
