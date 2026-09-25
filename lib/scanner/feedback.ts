/**
 * Sound and haptic feedback utilities for BookGuard barcode scanners.
 * Uses Web Audio API oscillator synthesis (zero external audio file dependencies).
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

// Initialize sound preference from localStorage if available
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("bookguard_scanner_sound");
    if (saved !== null) {
      soundEnabled = saved === "1" || saved === "true";
    }
  } catch {
    // Ignore localStorage issues
  }
}

/**
 * Initializes or unlocks the Web Audio API context during user interaction.
 */
export function initScannerAudio(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass && !audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
  } catch (err) {
    console.warn("AudioContext init error:", err);
  }
}

/**
 * Checks whether scanner sound is enabled.
 */
export function isScannerSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Toggles or sets scanner sound on/off.
 */
export function setScannerSoundEnabled(enabled: boolean): boolean {
  soundEnabled = enabled;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("bookguard_scanner_sound", enabled ? "1" : "0");
    } catch {
      // Ignore
    }
  }
  return soundEnabled;
}

/**
 * Plays a crisp, satisfying scanner confirmation chime on barcode detection.
 * Pleasant dual-tone high frequency beep (1046 Hz -> 1568 Hz) like modern retail scanners.
 */
export function playBarcodeBeep(): void {
  if (typeof window === "undefined" || !soundEnabled) return;
  try {
    initScannerAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    // Crisp ascending chime: 1046 Hz (C6) -> 1568 Hz (G6)
    osc.frequency.setValueAtTime(1046.5, now);
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.07);

    // Smooth envelope to prevent audio clicking
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  } catch (err) {
    console.warn("Barcode beep error:", err);
  }
}

/**
 * Plays an alert chime when a duplicate or warning is detected.
 */
export function playDuplicateAlertBeep(): void {
  if (typeof window === "undefined" || !soundEnabled) return;
  try {
    initScannerAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "triangle";
    // Double pulse warning beep
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(440, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch (err) {
    console.warn("Warning beep error:", err);
  }
}

/**
 * Triggers crisp haptic feedback for barcode capture.
 */
export function triggerScanHaptic(): void {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate([25, 40, 35]);
  } catch {
    // Ignore unsupported
  }
}
