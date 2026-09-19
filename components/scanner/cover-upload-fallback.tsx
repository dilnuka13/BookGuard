"use client";

import * as React from "react";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { validateCoverFile } from "@/lib/utils/image";

interface CoverUploadFallbackProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

export function CoverUploadFallback({ onImageSelected, disabled }: CoverUploadFallbackProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    const validation = validateCoverFile(file);
    if (!validation.isValid) {
      setError(validation.error || "Invalid image file");
      return;
    }
    setError(null);
    onImageSelected(file);
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        className={`cursor-pointer border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
          dragOver
            ? "border-primary bg-primary/5 scale-[0.99]"
            : "border-border hover:border-primary/50 hover:bg-muted/40"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h4 className="text-sm font-bold text-foreground">Upload Cover Photo</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Choose a clear photo of the book cover or barcode from your device gallery.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {error && (
        <p className="text-xs text-destructive text-center font-medium mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
