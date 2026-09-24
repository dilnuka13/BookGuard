"use client";

import * as React from "react";
import { Sparkles, Sliders, RotateCcw, Droplets, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_GLASS_INTENSITY,
  GLASS_PRESETS,
  applyLiquidGlassIntensity,
  getGlassDescriptor,
  getStoredGlassIntensity,
} from "@/lib/theme/liquid-glass";
import { triggerHaptic } from "@/lib/utils/haptics";

export function LiquidGlassSlider({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [intensity, setIntensity] = React.useState<number>(DEFAULT_GLASS_INTENSITY);

  // Sync stored intensity on mount
  React.useEffect(() => {
    const saved = getStoredGlassIntensity();
    setIntensity(saved);
    applyLiquidGlassIntensity(saved);
    setMounted(false || true);
  }, []);

  const handleChange = (newVal: number) => {
    setIntensity(newVal);
    applyLiquidGlassIntensity(newVal);
  };

  const handlePresetSelect = (presetVal: number) => {
    triggerHaptic("light");
    handleChange(presetVal);
  };

  const handleReset = () => {
    triggerHaptic("medium");
    handleChange(DEFAULT_GLASS_INTENSITY);
  };

  const descriptor = getGlassDescriptor(intensity);
  const isDefault = intensity === DEFAULT_GLASS_INTENSITY;

  // Calculate track progress percentage for the range slider (0% to 100%)
  const minVal = 0;
  const maxVal = 100;
  const progressPercent = Math.round(((intensity - minVal) / (maxVal - minVal)) * 100);

  if (!mounted) {
    return (
      <div className={cn("p-4 rounded-2xl bg-muted/30 border border-border/50 animate-pulse space-y-3", className)}>
        <div className="h-5 w-48 bg-muted rounded-md" />
        <div className="h-8 w-full bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 pt-2", className)}>
      {/* ── Title & Status Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Droplets className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-bold text-foreground">
              Navigation Liquid Glass Transparency
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Single controller to customize frosted translucency for both Top Header & Bottom Dock.
          </p>
        </div>

        {/* Current Value Pill & Reset Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors",
              intensity < 30
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400"
                : intensity < 80
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-300"
            )}
          >
            <span>{intensity}%</span>
            <span className="opacity-60">•</span>
            <span>{descriptor.badge}</span>
          </span>

          {!isDefault && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              title="Reset to default 70% balanced glass"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden xs:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Scroller / Progress Range Control ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <span>🧊</span> 0% (Pure Clear)
            </span>
            <span className="text-foreground font-bold">{intensity}% Opacity</span>
            <span className="flex items-center gap-1">
              <span>🛡️</span> 100% (Solid)
            </span>
          </div>

          {/* Interactive Range Slider with dynamic track gradient */}
          <div className="relative flex items-center py-2">
            <input
              type="range"
              min={minVal}
              max={maxVal}
              step={1}
              value={intensity}
              onChange={(e) => handleChange(Number(e.target.value))}
              aria-label="Liquid Glass Opacity Slider"
              className={cn(
                "w-full h-2.5 rounded-full appearance-none cursor-pointer focus:outline-none",
                "bg-slate-200 dark:bg-slate-800",
                // Custom webkit slider thumb styles
                "[&::-webkit-slider-thumb]:appearance-none",
                "[&::-webkit-slider-thumb]:h-6",
                "[&::-webkit-slider-thumb]:w-6",
                "[&::-webkit-slider-thumb]:rounded-full",
                "[&::-webkit-slider-thumb]:bg-gradient-to-tr",
                "[&::-webkit-slider-thumb]:from-emerald-500",
                "[&::-webkit-slider-thumb]:via-teal-400",
                "[&::-webkit-slider-thumb]:to-cyan-400",
                "[&::-webkit-slider-thumb]:border-2",
                "[&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-900",
                "[&::-webkit-slider-thumb]:shadow-[0_2px_12px_rgba(16,185,129,0.5)]",
                "[&::-webkit-slider-thumb]:transition-transform",
                "[&::-webkit-slider-thumb]:hover:scale-110",
                "[&::-webkit-slider-thumb]:active:scale-95",
                // Firefox thumb
                "[&::-moz-range-thumb]:h-6",
                "[&::-moz-range-thumb]:w-6",
                "[&::-moz-range-thumb]:rounded-full",
                "[&::-moz-range-thumb]:bg-emerald-500",
                "[&::-moz-range-thumb]:border-2",
                "[&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-slate-900",
                "[&::-moz-range-thumb]:shadow-[0_2px_12px_rgba(16,185,129,0.5)]"
              )}
              style={{
                background: `linear-gradient(to right, #10b981 0%, #14b8a6 ${progressPercent}%, rgba(148, 163, 184, 0.25) ${progressPercent}%, rgba(148, 163, 184, 0.25) 100%)`,
              }}
            />
          </div>
        </div>

        {/* ── Preset Quick Pickers ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {GLASS_PRESETS.map((p) => {
            const isSelected = Math.abs(intensity - p.value) <= 5;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePresetSelect(p.value)}
                className={cn(
                  "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-150",
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/40 shadow-sm scale-[1.02]"
                    : "border-border/70 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-base leading-none mb-1">{p.emoji}</span>
                <span className="text-xs font-bold truncate">{p.label}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{p.value}%</span>
              </button>
            );
          })}
        </div>

        {/* ── Real-Time Interactive Live Preview Box ── */}
        <div className="relative overflow-hidden rounded-xl border border-border/80 bg-slate-950 p-4 select-none">
          {/* Decorative vibrant background orbs demonstrating blur and transparency */}
          <div
            className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-emerald-500/60 blur-xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute top-2 right-4 h-20 w-20 rounded-full bg-cyan-500/60 blur-xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-6 left-1/3 h-24 w-24 rounded-full bg-violet-600/50 blur-xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <span className="font-semibold uppercase tracking-wider">Live Glass Preview</span>
              <span className="font-mono text-emerald-400 font-bold">{descriptor.description}</span>
            </div>

            {/* Simulated Floating Glass Bar */}
            <div className="liquid-glass rounded-xl p-2.5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/30 flex items-center justify-center text-white text-xs font-bold">
                  BG
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground leading-tight">
                    Header & Bottom Navigation
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-none">
                    Real-time liquid glass preview
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
