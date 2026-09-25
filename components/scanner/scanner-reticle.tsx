"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Barcode } from "lucide-react";

interface ScannerReticleProps {
  isScanning?: boolean;
  statusText?: string;
  subText?: string;
}

export function ScannerReticle({
  isScanning = true,
  statusText,
  subText = "Align book barcode or ISBN inside box",
}: ScannerReticleProps) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 z-10 select-none">
      {/* Darkened vignette around target window */}
      <div className="relative w-full max-w-[320px] aspect-[4/3] sm:max-w-[370px] rounded-3xl overflow-hidden border-2 border-white/25 shadow-[0_0_0_9999px_rgba(0,0,0,0.58)] transition-all">
        {/* Corner Brackets */}
        {/* Top-Left */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
        {/* Top-Right */}
        <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
        {/* Bottom-Left */}
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
        {/* Bottom-Right */}
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]" />

        {/* Center watermark icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15">
          <Barcode className="w-20 h-20 text-white" />
        </div>

        {/* Subtle scanning laser line */}
        {isScanning && (
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_rgba(52,211,153,0.9)]"
            animate={{
              top: ["10%", "90%", "10%"],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      {/* Helper text badge */}
      <div className="mt-4 flex flex-col items-center gap-1">
        {statusText && (
          <div className="px-4 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-white text-xs font-semibold tracking-wide shadow-lg text-center max-w-[320px]">
            {statusText}
          </div>
        )}
        {subText && (
          <div className="text-[11px] text-white/70 font-medium tracking-wide drop-shadow-md text-center">
            {subText}
          </div>
        )}
      </div>
    </div>
  );
}
