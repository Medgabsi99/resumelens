"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Mic, Activity, AlertCircle, Sparkles, Volume2, Clock } from "lucide-react";

interface Props {
  isRecording: boolean;
  transcriptText?: string;
  className?: string;
}

const FILLER_PATTERNS = [/\bum\b/gi, /\buh\b/gi, /\blike\b/gi, /\bbasically\b/gi, /\bactually\b/gi, /\byou know\b/gi];

export default function AudioSpectrumVisualizer({
  isRecording,
  transcriptText = "",
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);

  // ── Recording Duration Timer ──────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      const now = Date.now();
      setStartTime(now);
      interval = setInterval(() => {
        setElapsedSeconds(Math.max(1, Math.floor((Date.now() - now) / 1000)));
      }, 500);
    } else {
      setStartTime(null);
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // ── Real-Time Metrics Calculations ─────────────────────────
  const wordCount = useMemo(() => {
    if (!transcriptText || !transcriptText.trim()) return 0;
    return transcriptText.trim().split(/\s+/).length;
  }, [transcriptText]);

  const wpm = useMemo(() => {
    if (elapsedSeconds <= 2 || wordCount === 0) return 0;
    return Math.round((wordCount / elapsedSeconds) * 60);
  }, [wordCount, elapsedSeconds]);

  const fillerCount = useMemo(() => {
    if (!transcriptText) return 0;
    let count = 0;
    FILLER_PATTERNS.forEach((pattern) => {
      const matches = transcriptText.match(pattern);
      if (matches) count += matches.length;
    });
    return count;
  }, [transcriptText]);

  const pacingStatus = useMemo(() => {
    if (wpm === 0) return { label: "Listening...", color: "var(--ink-muted)", bg: "var(--paper)" };
    if (wpm < 110) return { label: "Pacing: Slow (< 110 WPM)", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" };
    if (wpm > 165) return { label: "Pacing: Fast (> 165 WPM)", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" };
    return { label: "Pacing: Ideal Pace 🎯", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" };
  }, [wpm]);

  // ── Web Audio API Canvas Visualizer Setup ──────────────────
  useEffect(() => {
    if (!isRecording) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setVolumeLevel(0);
      return;
    }

    let isSubscribed = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; // 32 frequency bins
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const renderFrame = () => {
          if (!isSubscribed) return;
          animFrameRef.current = requestAnimationFrame(renderFrame);

          analyser.getByteFrequencyData(dataArray);

          // Calculate average volume level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avgVol = Math.min(100, Math.round((sum / dataArray.length / 255) * 100));
          setVolumeLevel(avgVol);

          // Clear Canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const barCount = 24;
          const barGap = 4;
          const totalWidth = canvas.width;
          const barWidth = (totalWidth - (barCount - 1) * barGap) / barCount;

          for (let i = 0; i < barCount; i++) {
            const freqVal = dataArray[i % dataArray.length] || 0;
            const barHeight = Math.max(6, (freqVal / 255) * (canvas.height - 10));
            const x = i * (barWidth + barGap);
            const y = canvas.height - barHeight;

            // Dynamic Gradient: Cyan -> Purple -> Emerald
            const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
            grad.addColorStop(0, "#8b5cf6");
            grad.addColorStop(0.5, "#06b6d4");
            grad.addColorStop(1, "#10b981");

            ctx.fillStyle = grad;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, y, barWidth, barHeight, 3);
            } else {
              ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();
          }
        };

        renderFrame();
      } catch (err) {
        // Fallback simulation mode if mic fails or restricted
        simulateFallbackCanvas();
      }
    }

    function simulateFallbackCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let step = 0;
      const renderSimulated = () => {
        if (!isSubscribed) return;
        animFrameRef.current = requestAnimationFrame(renderSimulated);
        step += 0.1;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barCount = 24;
        const barGap = 4;
        const barWidth = (canvas.width - (barCount - 1) * barGap) / barCount;

        for (let i = 0; i < barCount; i++) {
          const simulatedVal = Math.abs(Math.sin(step + i * 0.4)) * 0.75 + 0.15;
          const barHeight = simulatedVal * (canvas.height - 10);
          const x = i * (barWidth + barGap);
          const y = canvas.height - barHeight;

          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, "#8b5cf6");
          grad.addColorStop(1, "#34d399");

          ctx.fillStyle = grad;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, 3);
          } else {
            ctx.rect(x, y, barWidth, barHeight);
          }
          ctx.fill();
        }
      };
      renderSimulated();
    }

    initAudio();

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <div
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "14px 18px",
        marginTop: "12px",
        marginBottom: "12px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
      }}
      className={className}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
        {/* Recording Status & Frequency Meter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)", fontFamily: "DM Mono, monospace" }}>
            LIVE VOICE SPECTRUM
          </span>
        </div>

        {/* HUD Pacing Badge */}
        <div
          style={{
            background: pacingStatus.bg,
            color: pacingStatus.color,
            border: `1px solid ${pacingStatus.color}`,
            borderRadius: "99px",
            padding: "3px 10px",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "DM Mono, monospace",
          }}
        >
          {pacingStatus.label}
        </div>
      </div>

      {/* 60fps Canvas Frequency Equalizer */}
      <div style={{ width: "100%", height: "48px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "12px" }}>
        <canvas ref={canvasRef} width={400} height={48} style={{ width: "100%", height: "48px" }} />
      </div>

      {/* Real-time Voice Coach Statistics Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: "8px",
          background: "var(--paper-warm)",
          padding: "8px 12px",
          borderRadius: "10px",
          border: "1px solid var(--border)",
          fontSize: "11px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock size={13} style={{ color: "#8b5cf6" }} />
          <span>
            Duration: <strong style={{ color: "var(--ink)" }}>{elapsedSeconds}s</strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Activity size={13} style={{ color: "#06b6d4" }} />
          <span>
            Speed: <strong style={{ color: "var(--ink)" }}>{wpm} WPM</strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertCircle size={13} style={{ color: fillerCount > 3 ? "#ef4444" : "#10b981" }} />
          <span>
            Fillers (um/uh):{" "}
            <strong style={{ color: fillerCount > 3 ? "#ef4444" : "#10b981" }}>{fillerCount}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
