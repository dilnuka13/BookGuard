let audioCtx: AudioContext | null = null;

/**
 * Initializes or unlocks the Web Audio API context during user gesture.
 */
export function initAudio(): void {
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
 * Plays a crisp, pleasant confirmation chime on barcode detection.
 */
export function playScanSuccessTone(): void {
  if (typeof window === "undefined") return;
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    // Crisp ascending chime: 1046 Hz (C6) -> 1318 Hz (E6)
    osc.frequency.setValueAtTime(1046.5, now);
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch (err) {
    console.warn("Scan tone playback error:", err);
  }
}

/**
 * Triggers haptic vibration if supported by device.
 */
export function triggerHapticFeedback(): void {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate([40, 30, 60]);
  } catch {
    // Ignore unsupported devices
  }
}
