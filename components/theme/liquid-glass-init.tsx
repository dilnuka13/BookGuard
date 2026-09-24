"use client";

import * as React from "react";
import { applyLiquidGlassIntensity, getStoredGlassIntensity } from "@/lib/theme/liquid-glass";

export function LiquidGlassInit() {
  React.useEffect(() => {
    const saved = getStoredGlassIntensity();
    applyLiquidGlassIntensity(saved);
  }, []);

  return null;
}
