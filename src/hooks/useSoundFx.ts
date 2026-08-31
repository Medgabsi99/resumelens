"use client";

import { useState, useEffect, useCallback } from "react";
import { playSound, isSoundEnabled, setSoundEnabled, type SoundType } from "@/lib/soundFx";

export function useSoundFx() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  const toggleSound = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        playSound("click");
      }
      return next;
    });
  }, []);

  const play = useCallback((type: SoundType) => {
    playSound(type);
  }, []);

  return {
    enabled,
    toggleSound,
    play,
    playClick: () => playSound("click"),
    playApply: () => playSound("apply"),
    playSuccess: () => playSound("success"),
    playMilestone: () => playSound("milestone90"),
    playUndo: () => playSound("undo"),
  };
}
