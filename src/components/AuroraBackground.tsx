"use client";

/**
 * AuroraBackground
 *
 * Five slow-drifting radial-gradient orbs rendered entirely with CSS
 * keyframes + filter: blur(). No canvas, no JS per-frame — the browser
 * compositor runs this on the GPU with zero main-thread cost.
 *
 * Colours are dim in light mode (opacity 0.14–0.20) and rich in dark mode
 * (opacity 0.28–0.45) via CSS custom properties on [data-theme="dark"].
 */
export default function AuroraBackground() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Aurora orb base ─────────────────────────────────────── */
        .aurora-root {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .aurora-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(72px);
          will-change: transform;
          opacity: 0;  /* set per-orb below */
        }

        /* ── Orb 1: indigo — top-left ────────────────────────────── */
        .aurora-orb-1 {
          width: 600px; height: 600px;
          top: -180px; left: -100px;
          background: radial-gradient(circle at 40% 40%, #6366f1 0%, transparent 65%);
          animation: aurora-drift-1 28s ease-in-out infinite;
          opacity: var(--aurora-opacity-1, 0.14);
        }

        /* ── Orb 2: violet — top-right ───────────────────────────── */
        .aurora-orb-2 {
          width: 520px; height: 520px;
          top: -80px; right: -140px;
          background: radial-gradient(circle at 60% 35%, #a78bfa 0%, transparent 65%);
          animation: aurora-drift-2 34s ease-in-out infinite;
          opacity: var(--aurora-opacity-2, 0.12);
        }

        /* ── Orb 3: emerald — bottom-right ───────────────────────── */
        .aurora-orb-3 {
          width: 480px; height: 480px;
          bottom: -140px; right: -80px;
          background: radial-gradient(circle at 55% 60%, #34d399 0%, transparent 65%);
          animation: aurora-drift-3 38s ease-in-out infinite;
          opacity: var(--aurora-opacity-3, 0.10);
        }

        /* ── Orb 4: blue — bottom-left ───────────────────────────── */
        .aurora-orb-4 {
          width: 560px; height: 560px;
          bottom: -200px; left: -120px;
          background: radial-gradient(circle at 35% 65%, #60a5fa 0%, transparent 65%);
          animation: aurora-drift-4 32s ease-in-out infinite;
          opacity: var(--aurora-opacity-4, 0.11);
        }

        /* ── Orb 5: rose/pink — center drift ─────────────────────── */
        .aurora-orb-5 {
          width: 380px; height: 380px;
          top: 30%; left: 35%;
          background: radial-gradient(circle at 50% 50%, #f472b6 0%, transparent 65%);
          animation: aurora-drift-5 24s ease-in-out infinite;
          opacity: var(--aurora-opacity-5, 0.07);
        }

        /* ── Dark mode: richer, more vivid ───────────────────────── */
        [data-theme="dark"] .aurora-orb-1 { opacity: var(--aurora-opacity-1, 0.32); }
        [data-theme="dark"] .aurora-orb-2 { opacity: var(--aurora-opacity-2, 0.28); }
        [data-theme="dark"] .aurora-orb-3 { opacity: var(--aurora-opacity-3, 0.22); }
        [data-theme="dark"] .aurora-orb-4 { opacity: var(--aurora-opacity-4, 0.26); }
        [data-theme="dark"] .aurora-orb-5 { opacity: var(--aurora-opacity-5, 0.16); }
        [data-theme="dark"] .aurora-orb   { mix-blend-mode: screen; }

        /* ── Keyframes — each orb drifts along a unique oval path ── */
        @keyframes aurora-drift-1 {
          0%   { transform: translate(0px, 0px)   scale(1.00); }
          20%  { transform: translate(60px, 40px)  scale(1.08); }
          40%  { transform: translate(30px, 90px)  scale(0.96); }
          60%  { transform: translate(-40px, 60px) scale(1.04); }
          80%  { transform: translate(-20px, 10px) scale(0.98); }
          100% { transform: translate(0px, 0px)   scale(1.00); }
        }

        @keyframes aurora-drift-2 {
          0%   { transform: translate(0px, 0px)    scale(1.00); }
          25%  { transform: translate(-70px, 50px) scale(1.06); }
          50%  { transform: translate(-40px, 100px)scale(0.94); }
          75%  { transform: translate(30px, 40px)  scale(1.02); }
          100% { transform: translate(0px, 0px)    scale(1.00); }
        }

        @keyframes aurora-drift-3 {
          0%   { transform: translate(0px, 0px)    scale(1.00); }
          30%  { transform: translate(-50px, -60px)scale(1.10); }
          60%  { transform: translate(40px, -30px) scale(0.92); }
          100% { transform: translate(0px, 0px)    scale(1.00); }
        }

        @keyframes aurora-drift-4 {
          0%   { transform: translate(0px, 0px)   scale(1.00); }
          35%  { transform: translate(80px, -40px) scale(1.07); }
          70%  { transform: translate(20px, -80px) scale(0.95); }
          100% { transform: translate(0px, 0px)   scale(1.00); }
        }

        @keyframes aurora-drift-5 {
          0%   { transform: translate(0px, 0px)    scale(1.00); }
          20%  { transform: translate(-60px, -50px)scale(1.12); }
          45%  { transform: translate(50px, -30px) scale(0.90); }
          70%  { transform: translate(30px, 60px)  scale(1.05); }
          100% { transform: translate(0px, 0px)    scale(1.00); }
        }

        /* ── Reduce motion: freeze all orbs ──────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .aurora-orb { animation: none; }
        }
      `}} />

      <div className="aurora-root" aria-hidden="true">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="aurora-orb aurora-orb-4" />
        <div className="aurora-orb aurora-orb-5" />
      </div>
    </>
  );
}
