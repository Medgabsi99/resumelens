"use client";

import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  gravity: number;
  drag: number;
  shape: "rect" | "circle" | "star";
}

// ─── Color palettes by milestone ────────────────────────────
const PALETTE_80 = [
  "#f59e0b", "#fbbf24", "#fcd34d",  // amber / gold
  "#6366f1", "#818cf8",              // indigo (brand)
  "#10b981", "#34d399",              // emerald
  "#f8fafc", "#e2e8f0",              // white / silver
];

const PALETTE_90 = [
  "#f59e0b", "#fbbf24",              // gold
  "#ef4444", "#f87171",              // red
  "#6366f1", "#a78bfa",              // purple / indigo
  "#10b981", "#6ee7b7",              // emerald
  "#ec4899", "#f9a8d4",              // pink
  "#06b6d4", "#67e8f9",              // cyan
  "#f8fafc",                          // white
];

// ─── Helpers ─────────────────────────────────────────────────
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeParticles(
  count: number,
  originX: number,
  originY: number,
  palette: string[],
  spreadX = 1,
  spreadY = 1
): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = rand(-Math.PI, Math.PI);
    const speed = rand(4, 18) * spreadY;
    return {
      x: originX + rand(-60, 60) * spreadX,
      y: originY,
      vx: Math.cos(angle) * speed * 0.8,
      vy: Math.sin(angle) * speed - rand(6, 14), // initial upward bias
      rotation: rand(0, Math.PI * 2),
      rotationSpeed: rand(-0.18, 0.18),
      width: rand(6, 14),
      height: rand(4, 8),
      color: pick(palette),
      opacity: 1,
      gravity: rand(0.25, 0.45),
      drag: rand(0.97, 0.99),
      shape: pick(["rect", "rect", "circle", "star"]),
    };
  });
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const spikes = 5;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? r : r * 0.4;
    const angle = i * step - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  score: number;
  trigger?: boolean; // re-fire when this flips true
}

const MILESTONE_A = 80; // gold burst
const MILESTONE_S = 90; // full rainbow celebration

export default function ConfettiCannon({ score, trigger }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    // Only fire on mount or when trigger flips
    if (score < MILESTONE_A) return;
    if (firedRef.current && trigger === undefined) return;
    firedRef.current = true;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      pointer-events: none;
      z-index: 99999;
    `;
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const isElite = score >= MILESTONE_S;
    const palette = isElite ? PALETTE_90 : PALETTE_80;
    const count = isElite ? 180 : 90;

    // Origin: center-top of viewport (where ScoreRing lives)
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.35;

    let particles = makeParticles(count, cx, cy, palette);

    // For elite scores, add a second wave from left + right sides after 300ms
    if (isElite) {
      setTimeout(() => {
        particles = [
          ...particles,
          ...makeParticles(60, canvas.width * 0.15, cy * 0.9, palette, 0.5, 0.8),
          ...makeParticles(60, canvas.width * 0.85, cy * 0.9, palette, 0.5, 0.8),
        ];
      }, 320);
    }

    const ctx = canvas.getContext("2d")!;

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive++;

        // Physics
        p.vy += p.gravity;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade once below mid-screen
        if (p.y > canvas.height * 0.55) {
          p.opacity -= 0.018;
        }

        // Draw
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          drawStar(ctx, 0, 0, p.width / 2);
        } else {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        }

        ctx.restore();
      }

      if (alive > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // All particles gone — clean up
        window.removeEventListener("resize", resize);
        canvas.remove();
        canvasRef.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return null; // renders nothing — canvas is appended to body directly
}
