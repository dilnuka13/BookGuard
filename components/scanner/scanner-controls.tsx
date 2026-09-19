"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Barcode, Image as ImageIcon, Camera } from "lucide-react";

interface ScannerControlsProps {
  onOpenManualIsbn: () => void;
  onUploadImageClick: () => void;
  onCaptureFrame?: () => void;
  disabled?: boolean;
}

export function ScannerControls({
  onOpenManualIsbn,
  onUploadImageClick,
  onCaptureFrame,
  disabled = false,
}: ScannerControlsProps) {
  return (
    <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-3 px-4 pointer-events-auto">
      {/* ISBN Tracker & Inspector */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={onOpenManualIsbn}
        className="rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 px-4 h-11 text-xs font-semibold gap-2 shadow-lg transition-transform active:scale-95"
      >
        <Barcode className="h-4 w-4 text-emerald-400" />
        <span>ISBN Tracker</span>
      </Button>

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
