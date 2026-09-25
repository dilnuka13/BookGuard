"use client";

import * as React from "react";
import { CameraView } from "@/components/scanner/camera-view";
import { ScannerReticle } from "@/components/scanner/scanner-reticle";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/lib/utils/haptics";
import { X, Camera, Barcode, Check } from "lucide-react";

interface QuickScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
  title?: string;
  description?: string;
}

export function QuickScanModal({
  isOpen,
  onClose,
  onBarcodeDetected,
  title = "Instant Camera Scanner",
  description = "Point your camera at any book barcode or ISBN to auto-fill",
}: QuickScanModalProps) {
  const [manualCode, setManualCode] = React.useState("");
  const [lastScanned, setLastScanned] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleDetected = (barcode: string) => {
    const clean = barcode.trim();
    if (!clean) return;

    setLastScanned(clean);
    triggerHaptic("success");

    setTimeout(() => {
      onBarcodeDetected(clean);
      onClose();
      setLastScanned(null);
    }, 450);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (clean) {
      onBarcodeDetected(clean);
      onClose();
      setManualCode("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-slate-950 text-white shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">{title}</h3>
              <p className="text-[11px] text-white/70 line-clamp-1">{description}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black overflow-hidden">
          <CameraView
            isScanning={isOpen && !lastScanned}
            onBarcodeDetected={handleDetected}
          />
          <ScannerReticle
            isScanning={isOpen && !lastScanned}
            statusText={lastScanned ? `Scanned: ${lastScanned}` : "Scanning Barcode..."}
            subText="Align ISBN or book barcode within frame"
          />

          {/* Success Overlay Flash */}
          {lastScanned && (
            <div className="absolute inset-0 z-20 bg-emerald-600/40 backdrop-blur-xs flex flex-col items-center justify-center text-white animate-in fade-in zoom-in-95">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-600 shadow-xl mb-2">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>
              <p className="text-base font-bold">Barcode Captured!</p>
              <p className="text-xs font-mono font-semibold tracking-wider opacity-90 mt-0.5">
                {lastScanned}
              </p>
            </div>
          )}
        </div>

        {/* Footer with Manual Input fallback */}
        <div className="p-3.5 sm:p-4 bg-slate-900/90 border-t border-white/10">
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                placeholder="Or type ISBN / barcode manually..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <Button
              type="submit"
              disabled={!manualCode.trim()}
              size="sm"
              className="h-9 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shrink-0"
            >
              Apply
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
