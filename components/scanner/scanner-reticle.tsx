"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface ScannerReticleProps {
  isScanning?: boolean;
  statusText?: string;
}

export function ScannerReticle({ isScanning = true, statusText }: ScannerReticleProps) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 z-10">
      {/* Darkened vignette around target window */}
      <div className="relative w-full max-w-[320px] aspect-[4/3] sm:max-w-[360px] rounded-3xl overflow-hidden border-2 border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
        {/* Corner Brackets */}
        {/* Top-Left */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-sm" />
        {/* Top-Right */}
        <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-sm" />
        {/* Bottom-Left */}
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-sm" />
        {/* Bottom-Right */}
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-sm" />

        {/* Subtle scanning laser line */}
        {isScanning && (
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)]"
            animate={{
              top: ["8%", "92%", "8%"],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      {/* Helper text badge */}
      {statusText && (
        <div className="mt-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium tracking-wide shadow-lg animate-fade-in text-center max-w-[300px]">
          {statusText}
        </div>
      )}
    </div>
  );
}
