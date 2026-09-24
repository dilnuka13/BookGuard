/**
 * BookGuard Adaptive Liquid Glass Configuration & Persistence Helper
 * Controls the opacity, blur, and translucency of both top header and bottom nav.
 */

export const DEFAULT_GLASS_INTENSITY = 70; // 70% default balanced frosted glass
export const GLASS_STORAGE_KEY = "bookguard_glass_intensity";

export interface GlassPreset {
  value: number;
  label: string;
  badge: string;
  description: string;
  emoji: string;
}

export const GLASS_PRESETS: GlassPreset[] = [
  {
    value: 0,
    label: "Pure Clear",
    badge: "100% Transparent",
    description: "Completely see-through with pure backdrop blur",
    emoji: "🧊",
  },
  {
    value: 35,
    label: "Crystal Clear",
    badge: "Ultra Glass",
    description: "High transparency with subtle tint",
    emoji: "💎",
  },
  {
    value: 70,
    label: "Apple Frosted",
    badge: "Balanced (Default)",
    description: "Standard balanced frosted liquid glass",
    emoji: "🫧",
  },
  {
    value: 100,
    label: "Solid Surface",
    badge: "Opaque",
    description: "Maximum contrast, solid backdrop",
    emoji: "🛡️",
  },
];

export function getGlassDescriptor(val: number): {
  label: string;
  badge: string;
  description: string;
} {
  if (val <= 10) {
    return {
      label: "Pure Clear",
      badge: "100% Transparent",
      description: "Completely transparent see-through glass with rich backdrop blur",
    };
  }
  if (val <= 40) {
    return {
      label: "Crystal Clear",
      badge: "Ultra Glass",
      description: "High transparency with maximum underlying content visibility",
    };
  }
  if (val <= 65) {
    return {
      label: "Subtle Frost",
      badge: "Translucent",
      description: "Gentle tint with smooth background motion blur",
    };
  }
  if (val <= 85) {
    return {
      label: "Apple Frosted",
      badge: "Balanced (Default)",
      description: "Standard iOS liquid glass with balanced legibility",
    };
  }
  return {
    label: "Solid Surface",
    badge: "High Contrast",
    description: "Solid backdrop with maximum text contrast",
  };
}

/**
 * Apply liquid glass CSS variables dynamically to the document root in real-time.
 */
export function applyLiquidGlassIntensity(val: number): void {
  if (typeof document === "undefined") return;

  const clamped = Math.max(0, Math.min(100, Math.round(val)));
  const lightAlpha = (clamped / 100).toFixed(2);
  const darkAlpha = ((clamped / 100) * 0.92).toFixed(2);
  const blurPx = Math.round(8 + ((100 - clamped) / 100) * 20);

  document.documentElement.style.setProperty("--liquid-glass-alpha-light", lightAlpha);
  document.documentElement.style.setProperty("--liquid-glass-alpha-dark", darkAlpha);
  document.documentElement.style.setProperty("--liquid-glass-blur", `${blurPx}px`);

  try {
    localStorage.setItem(GLASS_STORAGE_KEY, String(clamped));
  } catch {
    // Ignore localStorage write failures in private/restricted mode
  }
}

/**
 * Read the user's stored liquid glass intensity (or fallback to default).
 */
export function getStoredGlassIntensity(): number {
  if (typeof window === "undefined") return DEFAULT_GLASS_INTENSITY;
  try {
    const raw = localStorage.getItem(GLASS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
  } catch {
    // Fallback on error
  }
  return DEFAULT_GLASS_INTENSITY;
}
