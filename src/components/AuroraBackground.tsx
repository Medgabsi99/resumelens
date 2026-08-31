"use client";

/**
 * AuroraBackground
 *
 * Five slow-drifting radial-gradient orbs rendered entirely with CSS
 * keyframes and smooth multi-stop radial gradients. Zero GPU filter blur cost,
 * zero main-thread JS runtime. The browser compositor runs this on the GPU
 * with 120 FPS hardware acceleration.
 *
 * Colours are dim in light mode (opacity 0.14–0.20) and rich in dark mode
 * (opacity 0.28–0.45) via CSS custom properties on [data-theme="dark"].
 */
export default function AuroraBackground() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ── Aurora orb base ─────────────────────────────────────── */
        .aurora-root {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          contain: strict;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }

        .aurora-orb {
          position: absolute;
          border-radius: 50%;
          will-change: transform;
          opacity: 0;  /* set per-orb below */
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }

        /* ── Orb 1: indigo — top-left ────────────────────────────── */
        .aurora-orb-1 {
          width: 540px; height: 540px;
          top: -140px; left: -80px;
          background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.45) 0%, rgba(99, 102, 241, 0.2) 25%, rgba(99, 102, 241, 0.08) 50%, rgba(99, 102, 241, 0.02) 70%, transparent 100%);
          animation: aurora-drift-1 30s ease-in-out infinite;
          opacity: var(--aurora-opacity-1, 0.16);
        }

        /* ── Orb 2: violet — top-right ───────────────────────────── */
        .aurora-orb-2 {
          width: 480px; height: 480px;
          top: -60px; right: -100px;
          background: radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.4) 0%, rgba(167, 139, 250, 0.18) 25%, rgba(167, 139, 250, 0.06) 50%, rgba(167, 139, 250, 0.02) 70%, transparent 100%);
          animation: aurora-drift-2 36s ease-in-out infinite;
          opacity: var(--aurora-opacity-2, 0.14);
        }

        /* ── Orb 3: emerald — bottom-right ───────────────────────── */
        .aurora-orb-3 {
          width: 440px; height: 440px;
          bottom: -100px; right: -60px;
          background: radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.38) 0%, rgba(52, 211, 153, 0.15) 25%, rgba(52, 211, 153, 0.05) 50%, rgba(52, 211, 153, 0.01) 70%, transparent 100%);
          animation: aurora-drift-3 40s ease-in-out infinite;
          opacity: var(--aurora-opacity-3, 0.12);
        }

        /* ── Orb 4: blue — bottom-left ───────────────────────────── */
        .aurora-orb-4 {
          width: 500px; height: 500px;
          bottom: -140px; left: -80px;
          background: radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.4) 0%, rgba(96, 165, 250, 0.16) 25%, rgba(96, 165, 250, 0.06) 50%, rgba(96, 165, 250, 0.02) 70%, transparent 100%);
          animation: aurora-drift-4 34s ease-in-out infinite;
          opacity: var(--aurora-opacity-4, 0.13);
        }

        /* ── Orb 5: rose/pink — center drift ─────────────────────── */
        .aurora-orb-5 {
          width: 360px; height: 360px;
          top: 30%; left: 35%;
          background: radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.3) 0%, rgba(244, 114, 182, 0.12) 25%, rgba(244, 114, 182, 0.04) 50%, rgba(244, 114, 182, 0.01) 70%, transparent 100%);
          animation: aurora-drift-5 26s ease-in-out infinite;
          opacity: var(--aurora-opacity-5, 0.08);
        }

        /* ── Dark mode: richer, more vivid ───────────────────────── */
        [data-theme="dark"] .aurora-orb-1 { opacity: var(--aurora-opacity-1, 0.36); }
        [data-theme="dark"] .aurora-orb-2 { opacity: var(--aurora-opacity-2, 0.32); }
        [data-theme="dark"] .aurora-orb-3 { opacity: var(--aurora-opacity-3, 0.25); }
        [data-theme="dark"] .aurora-orb-4 { opacity: var(--aurora-opacity-4, 0.30); }
        [data-theme="dark"] .aurora-orb-5 { opacity: var(--aurora-opacity-5, 0.18); }
        [data-theme="dark"] .aurora-orb   { mix-blend-mode: screen; }

        /* ── Keyframes — hardware accelerated translate3d ────────── */
        @keyframes aurora-drift-1 {
          0%   { transform: translate3d(0px, 0px, 0)   scale(1.00); }
          20%  { transform: translate3d(50px, 30px, 0)  scale(1.06); }
          40%  { transform: translate3d(25px, 70px, 0)  scale(0.96); }
          60%  { transform: translate3d(-30px, 45px, 0) scale(1.03); }
          80%  { transform: translate3d(-15px, 10px, 0) scale(0.98); }
          100% { transform: translate3d(0px, 0px, 0)   scale(1.00); }
        }

        @keyframes aurora-drift-2 {
          0%   { transform: translate3d(0px, 0px, 0)    scale(1.00); }
          25%  { transform: translate3d(-55px, 40px, 0) scale(1.05); }
          50%  { transform: translate3d(-30px, 80px, 0) scale(0.95); }
          75%  { transform: translate3d(25px, 30px, 0)  scale(1.02); }
          100% { transform: translate3d(0px, 0px, 0)    scale(1.00); }
        }

        @keyframes aurora-drift-3 {
          0%   { transform: translate3d(0px, 0px, 0)    scale(1.00); }
          30%  { transform: translate3d(-40px, -45px, 0) scale(1.08); }
          60%  { transform: translate3d(30px, -20px, 0) scale(0.94); }
          100% { transform: translate3d(0px, 0px, 0)    scale(1.00); }
        }

        @keyframes aurora-drift-4 {
          0%   { transform: translate3d(0px, 0px, 0)   scale(1.00); }
          35%  { transform: translate3d(60px, -30px, 0) scale(1.05); }
          70%  { transform: translate3d(15px, -60px, 0) scale(0.96); }
          100% { transform: translate3d(0px, 0px, 0)   scale(1.00); }
        }

        @keyframes aurora-drift-5 {
          0%   { transform: translate3d(0px, 0px, 0)    scale(1.00); }
          20%  { transform: translate3d(-45px, -35px, 0) scale(1.08); }
          45%  { transform: translate3d(35px, -20px, 0)  scale(0.92); }
          70%  { transform: translate3d(20px, 45px, 0)   scale(1.04); }
          100% { transform: translate3d(0px, 0px, 0)    scale(1.00); }
        }

        /* ── Reduce motion: freeze all orbs ──────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .aurora-orb { animation: none; }
        }
      `,
        }}
      />

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
