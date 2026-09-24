"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Barcode, Image as ImageIcon, Camera, Plus, Smartphone } from "lucide-react";

interface ScannerControlsProps {
  onOpenManualIsbn: () => void;
  onUploadImageClick: () => void;
  onCaptureFrame?: () => void;
  onScanWithPhone?: () => void;
  disabled?: boolean;
}

export function ScannerControls({
  onOpenManualIsbn,
  onUploadImageClick,
  onCaptureFrame,
  onScanWithPhone,
  disabled = false,
}: ScannerControlsProps) {
  return (
    <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-wrap items-center justify-center gap-2.5 px-4 pointer-events-auto">
      {/* Manual Add Direct Route */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        disabled={disabled}
        className="rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 px-3.5 h-11 text-xs font-semibold gap-1.5 shadow-lg transition-transform active:scale-95"
      >
        <Link href="/library/add">
          <Plus className="h-4 w-4 text-emerald-400" />
          <span>Manual Add</span>
        </Link>
      </Button>

      {/* ISBN Tracker & Inspector */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={onOpenManualIsbn}
        className="rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 px-3.5 h-11 text-xs font-semibold gap-1.5 shadow-lg transition-transform active:scale-95"
      >
        <Barcode className="h-4 w-4 text-emerald-400" />
        <span>ISBN Tracker</span>
      </Button>

      {/* Wireless Phone Scanner */}
      {onScanWithPhone && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onScanWithPhone}
          className="rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 px-3.5 h-11 text-xs font-semibold gap-1.5 shadow-lg transition-transform active:scale-95"
          title="Use your phone camera as a barcode scanner"
        >
          <Smartphone className="h-4 w-4 text-emerald-400" />
          <span>Scan with Phone</span>
        </Button>
      )}

      {/* Capture Cover / Frame Button */}
      {onCaptureFrame && (
        <button
          type="button"
          disabled={disabled}
          onClick={onCaptureFrame}
          aria-label="Capture book cover photo"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-2xl transition-transform hover:scale-105 active:scale-95 border-4 border-white/40 disabled:opacity-50"
        >
          <Camera className="h-6 w-6 text-slate-900" />
        </button>
      )}

      {/* Upload Cover from Gallery */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={onUploadImageClick}
        className="rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 px-4 h-11 text-xs font-semibold gap-2 shadow-lg transition-transform active:scale-95"
      >
        <ImageIcon className="h-4 w-4 text-teal-400" />
        <span>Upload Photo</span>
      </Button>
    </div>
  );
}
