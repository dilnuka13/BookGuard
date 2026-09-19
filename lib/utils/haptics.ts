/**
 * Safe haptic vibration utility for mobile and supported PWA browsers.
 * Non-blocking and fails silently if navigator.vibrate is unsupported or permission is denied.
 */
export function triggerHaptic(
  type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light"
): void {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    switch (type) {
      case "light":
        navigator.vibrate(15);
        break;
      case "medium":
        navigator.vibrate(30);
        break;
      case "heavy":
        navigator.vibrate(55);
        break;
      case "success":
        // Light double tap
        navigator.vibrate([20, 50, 25]);
        break;
      case "warning":
        // Subtle alert pulse
        navigator.vibrate([40, 60, 40]);
        break;
      case "error":
        // Staccato triple buzz
        navigator.vibrate([60, 50, 60, 50, 80]);
        break;
    }
  } catch {
    // Graceful silent fallback
  }
}
