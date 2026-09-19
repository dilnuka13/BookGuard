"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Sparkles, AlertTriangle, BookOpen, X, CheckCircle2 } from "lucide-react";
import { triggerHaptic } from "@/lib/utils/haptics";
import Image from "next/image";

export type DynamicIslandType = "OWNED" | "POSSIBLE_DUPLICATE" | "NEW" | "CART" | "WISHLIST";

export interface DynamicIslandAlertData {
  type: DynamicIslandType;
  title: string;
  author?: string;
  subtitle?: string;
  coverUrl?: string | null;
  isbn?: string | null;
  duration?: number;
}

const DYNAMIC_ISLAND_EVENT = "bookguard:dynamic-island";

/**
 * Dispatch a Dynamic Island notification alert from anywhere in the app.
 */
export function triggerDynamicIsland(data: DynamicIslandAlertData): void {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<DynamicIslandAlertData>(DYNAMIC_ISLAND_EVENT, {
    detail: data,
  });
  window.dispatchEvent(event);
}

/**
 * Synthesize a clean, native-feeling iOS notification chime using Web Audio API.
 * Requires zero external audio files and triggers with 0ms latency.
 */
function playDynamicIslandChime(type: DynamicIslandType) {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const isWarning = type === "OWNED" || type === "POSSIBLE_DUPLICATE";

    // Primary bell tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(isWarning ? 587.33 : 659.25, now); // D5 or E5
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    // Harmonic bell chime (double tone)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(isWarning ? 440.0 : 880.0, now + 0.08); // A4 or A5
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.3, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.36);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch {
    // AudioContext blocked or not allowed — fails silently
  }
}

export function DynamicIslandAlert() {
  const [currentAlert, setCurrentAlert] = React.useState<DynamicIslandAlertData | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const dismissAlert = React.useCallback(() => {
    setCurrentAlert(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<DynamicIslandAlertData>;
      const data = customEvent.detail;
      if (!data) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setCurrentAlert(data);

      // Play chime and trigger tactile haptic response
      playDynamicIslandChime(data.type);
      if (data.type === "OWNED") {
        triggerHaptic("warning");
      } else if (data.type === "POSSIBLE_DUPLICATE") {
        triggerHaptic("medium");
      } else {
        triggerHaptic("success");
      }

      // Auto dismiss
      timeoutRef.current = setTimeout(() => {
        dismissAlert();
      }, data.duration ?? 4500);
    };

    window.addEventListener(DYNAMIC_ISLAND_EVENT, handleEvent);
    return () => {
      window.removeEventListener(DYNAMIC_ISLAND_EVENT, handleEvent);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dismissAlert]);

  return (
    <div
      aria-live="polite"
      className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none px-3"
      style={{
        top: "max(10px, env(safe-area-inset-top, 10px))",
      }}
    >
      <AnimatePresence>
        {currentAlert && (
          <motion.div
            key={currentAlert.title + currentAlert.type}
            initial={{
              scale: 0.85,
              y: -24,
              opacity: 0,
              filter: "blur(4px)",
            }}
            animate={{
              scale: 1,
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
            }}
            exit={{
              scale: 0.82,
              y: -20,
              opacity: 0,
              filter: "blur(4px)",
            }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 26,
            }}
            className="pointer-events-auto w-full max-w-[390px]"
          >
            {/* ── Dynamic Island Pill Body ── */}
            <div
              className={`relative overflow-hidden rounded-[30px] bg-black text-white px-3.5 py-2.5 flex items-center gap-3 select-none backdrop-blur-3xl ${
                currentAlert.type === "OWNED"
                  ? "border border-amber-500/50 shadow-[0_16px_48px_-8px_rgba(245,158,11,0.45),0_4px_16px_rgba(0,0,0,0.9)]"
                  : currentAlert.type === "POSSIBLE_DUPLICATE"
                  ? "border border-yellow-500/40 shadow-[0_16px_48px_-8px_rgba(234,179,8,0.35),0_4px_16px_rgba(0,0,0,0.9)]"
                  : "border border-emerald-500/40 shadow-[0_16px_48px_-8px_rgba(16,185,129,0.4),0_4px_16px_rgba(0,0,0,0.9)]"
              }`}
            >
              {/* Subtle top reflection sheen mimicking iPhone glass */}
              <div className="absolute inset-x-8 top-1 h-1.5 rounded-full bg-white/20 blur-[1px] pointer-events-none" />

              {/* ── Left Indicator / Cover ── */}
              <div className="relative shrink-0">
                {currentAlert.coverUrl ? (
                  <div className="relative h-11 w-8 rounded-lg overflow-hidden border border-white/20 shadow-md">
                    <Image
                      src={currentAlert.coverUrl}
                      alt={currentAlert.title}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      currentAlert.type === "OWNED"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : currentAlert.type === "POSSIBLE_DUPLICATE"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {currentAlert.type === "OWNED" ? (
                      <ShieldAlert className="h-6 w-6 stroke-[2.2] animate-pulse" />
                    ) : currentAlert.type === "POSSIBLE_DUPLICATE" ? (
                      <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
                    ) : (
                      <Sparkles className="h-6 w-6 stroke-[2.2]" />
                    )}
                  </div>
                )}
              </div>

              {/* ── Center Content ── */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      currentAlert.type === "OWNED"
                        ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                        : currentAlert.type === "POSSIBLE_DUPLICATE"
                        ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.9)]"
                        : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      currentAlert.type === "OWNED"
                        ? "text-amber-400"
                        : currentAlert.type === "POSSIBLE_DUPLICATE"
                        ? "text-yellow-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {currentAlert.type === "OWNED"
                      ? "Already On Your Shelf!"
                      : currentAlert.type === "POSSIBLE_DUPLICATE"
                      ? "Possible Duplicate"
                      : "Safe to Buy • New Book"}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white truncate leading-tight">
                  {currentAlert.title}
                </h4>

                {currentAlert.author && (
                  <p className="text-[11px] text-white/65 truncate leading-none mt-0.5">
                    {currentAlert.author}
                  </p>
                )}
              </div>

              {/* ── Right Badge / Close ── */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    currentAlert.type === "OWNED"
                      ? "bg-amber-500/25 text-amber-300 border-amber-500/40"
                      : currentAlert.type === "POSSIBLE_DUPLICATE"
                      ? "bg-yellow-500/25 text-yellow-300 border-yellow-500/40"
                      : "bg-emerald-500/25 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {currentAlert.type === "OWNED"
                    ? "OWNED"
                    : currentAlert.type === "POSSIBLE_DUPLICATE"
                    ? "CHECK"
                    : "NEW"}
                </span>

                <button
                  type="button"
                  onClick={dismissAlert}
                  className="rounded-full p-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                  aria-label="Dismiss Dynamic Island alert"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
