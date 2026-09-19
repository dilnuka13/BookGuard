"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const SPLASH_KEY = "bg_splash_shown_v1";

export function AppSplashScreen() {
  const [visible, setVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [phase, setPhase] = React.useState<"logo" | "tagline" | "bar" | "done">("logo");

  React.useEffect(() => {
    // Only show once per browser session
    if (typeof window === "undefined") return;
    const already = sessionStorage.getItem(SPLASH_KEY);
    if (already) return;

    sessionStorage.setItem(SPLASH_KEY, "1");
    setVisible(true);

    // Orchestrate the animation timeline
    const t1 = setTimeout(() => setPhase("tagline"), 500);
    const t2 = setTimeout(() => setPhase("bar"), 900);

    // Animate progress 0 → 100 over ~1.1 seconds
    let raf: number;
    let start: number | null = null;
    const DURATION = 1100;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min(100, (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setPhase("done"), 250);
        setTimeout(() => setVisible(false), 700);
      }
    };

    const t3 = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden"
          style={{ background: "hsl(var(--background))" }}
          aria-label="BookGuard loading"
          role="status"
        >
          {/* ── Background ambient glow ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full opacity-20"
              style={{
                background:
                  "radial-gradient(circle, hsl(160 84% 39% / 0.6) 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 h-64 w-64 rounded-full opacity-10"
              style={{
                background:
                  "radial-gradient(circle, hsl(189 94% 43% / 0.8) 0%, transparent 70%)",
                filter: "blur(50px)",
              }}
            />
            <div
              className="absolute bottom-0 right-0 h-64 w-64 rounded-full opacity-10"
              style={{
                background:
                  "radial-gradient(circle, hsl(160 84% 39% / 0.8) 0%, transparent 70%)",
                filter: "blur(50px)",
              }}
            />
          </div>

          {/* ── Logo section ── */}
          <div className="relative flex flex-col items-center">
            {/* Glow ring */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute h-36 w-36 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(160 84% 39% / 0.3) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />

            {/* Logo mark */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="relative h-24 w-24 rounded-[28px] overflow-hidden"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.1), 0 8px 40px -8px rgba(5,150,105,0.5), 0 20px 60px -12px rgba(0,0,0,0.4)",
              }}
            >
              <Image
                src="/logos/bookguard-logo-mark.png"
                alt="BookGuard"
                fill
                priority
                className="object-contain p-3"
              />
            </motion.div>

            {/* App name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={phase !== "logo" ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-5 flex flex-col items-center gap-1"
            >
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                BookGuard
              </h1>
              <p className="text-sm font-medium text-muted-foreground tracking-wide">
                Know your shelf before you buy
              </p>
            </motion.div>
          </div>

          {/* ── Progress bar section ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={
              phase === "bar" || phase === "done"
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 16 }
            }
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-3 px-10"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Track */}
            <div className="relative h-1.5 w-full max-w-[220px] rounded-full overflow-hidden bg-muted/40">
              {/* Fill */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, hsl(160 84% 39%), hsl(173 80% 40%), hsl(189 94% 43%))",
                  boxShadow: "0 0 8px rgba(5,150,105,0.6)",
                }}
              />
              {/* Shimmer */}
              <motion.div
                animate={{ x: ["-100%", "400%"] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="absolute inset-y-0 w-16 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                }}
              />
            </div>

            {/* Percentage */}
            <motion.p
              className="text-xs font-semibold tabular-nums"
              style={{ color: "hsl(160 84% 39%)" }}
            >
              {Math.round(progress)}%
            </motion.p>
          </motion.div>

          {/* ── Bottom brand line ── */}
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(160 84% 39% / 0.6), hsl(189 94% 43% / 0.6), transparent)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
