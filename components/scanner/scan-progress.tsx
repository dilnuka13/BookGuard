"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanProgressProps {
  status: string;
  detail?: string;
  onCancel?: () => void;
}

export function ScanProgress({ status, detail, onCancel }: ScanProgressProps) {
  return (
    <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white animate-fade-in">
      <div className="relative mb-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>

      <h3 className="text-lg font-bold tracking-tight text-white">{status}</h3>
      {detail && (
        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
          {detail}
        </p>
      )}

      {onCancel && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="mt-6 rounded-full border-white/20 text-white hover:bg-white/10 gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          <span>Cancel Scan</span>
        </Button>
      )}
    </div>
  );
}
