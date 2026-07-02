// Synthesized audio feedback for negotiation events
export const playSynthSound = (type: "concession" | "warning" | "outcome") => {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const ctx = new AudioContextClass();
    
    if (type === "concession") {
      // Ascending chime: C5 to E5 to G5
      const now = ctx.currentTime;
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.12, start + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };
      playTone(523.25, now, 0.35); // C5
      playTone(659.25, now + 0.08, 0.35); // E5
      playTone(783.99, now + 0.16, 0.45); // G5
    } else if (type === "warning") {
      // Double low sawtooth beeps
      const now = ctx.currentTime;
      const playBeep = (start: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, start);
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.06, start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
        osc.start(start);
        osc.stop(start + 0.18);
      };
      playBeep(now);
      playBeep(now + 0.22);
    } else if (type === "outcome") {
      // Majestic major chord
      const now = ctx.currentTime;
      const playTone = (freq: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + delay);
        gainNode.gain.setValueAtTime(0, now + delay);
        gainNode.gain.linearRampToValueAtTime(0.05, now + delay + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.2);
        osc.start(now + delay);
        osc.stop(now + delay + 1.2);
      };
      playTone(261.63, 0); // C4
      playTone(329.63, 0.04); // E4
      playTone(392.00, 0.08); // G4
      playTone(523.25, 0.12); // C5
    }
  } catch (err) {
    console.warn("Failed to play synthesized sound:", err);
  }
};

