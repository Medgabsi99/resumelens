/**
 * soundFx.ts
 *
 * Sound FX Disabled Engine (No-op Safe Wrapper).
 */

export type SoundType = "click" | "apply" | "success" | "milestone90" | "undo";

let cachedSoundEnabled: boolean = false;

export function isSoundEnabled(): boolean {
  return cachedSoundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  cachedSoundEnabled = enabled;
}

export function triggerHaptic(_durationMs = 8): void {
  // Sound & haptics disabled
}

/**
 * No-op sound player (Sound FX disabled)
 */
export function playSound(_type?: SoundType): void {
  // Sound FX disabled
}
