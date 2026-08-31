"use client";

import React, { useRef } from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string;
  enableTilt?: boolean;
  borderBeam?: boolean;
  beamColor?: string;
  specularBorder?: boolean;
}

export default function SpotlightCard({
  children,
  glowColor = "rgba(255, 255, 255, 0.06)",
  enableTilt = true,
  borderBeam = false,
  beamColor = "linear-gradient(90deg, #6366f1, #10b981, #3b82f6)",
  specularBorder = true,
  className = "",
  style = {},
  ...props
}: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const el = divRef.current;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      el.style.setProperty("--spotlight-x", `${x}px`);
      el.style.setProperty("--spotlight-y", `${y}px`);

      if (enableTilt) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = Math.min(3, Math.max(-3, ((y - centerY) / centerY) * -3));
        const rotateY = Math.min(3, Math.max(-3, ((x - centerX) / centerX) * 3));
        el.style.setProperty("--tilt-x", `${rotateX}deg`);
        el.style.setProperty("--tilt-y", `${rotateY}deg`);
      }
    });
  };

  const handleMouseEnter = () => {
    if (divRef.current) {
      divRef.current.setAttribute("data-hovered", "true");
    }
  };

  const handleMouseLeave = () => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }
    if (divRef.current) {
      divRef.current.removeAttribute("data-hovered");
      divRef.current.style.setProperty("--tilt-x", "0deg");
      divRef.current.style.setProperty("--tilt-y", "0deg");
    }
  };

  const hasBg = className.includes("bg-");
  const hasBorder = className.includes("border-");
  const hasRounded = className.includes("rounded-");

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden transition-[box-shadow,border-color,transform] duration-200 ease-out ${
        hasRounded ? "" : "rounded-2xl"
      } ${hasBorder ? "" : "border border-border"} ${hasBg ? "" : "bg-paper-card"} ${className}`}
      style={{
        transform: "perspective(1000px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))",
        transformStyle: "preserve-3d",
        ...style,
      }}
      {...props}
    >
      {/* Animated Conic Border Beam */}
      {borderBeam && (
        <div
          className="pointer-events-none absolute -inset-[1.5px] rounded-2xl z-0 overflow-hidden opacity-40 group-hover:opacity-90 transition-opacity duration-300"
          style={{
            background: beamColor,
          }}
        />
      )}

      {/* Neutral Specular Edge Highlight on Hover */}
      {specularBorder && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background:
              "radial-gradient(350px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(255, 255, 255, 0.12), transparent 70%)",
          }}
        />
      )}

      {/* Neutral Radial Cursor Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        style={{
          background: `radial-gradient(420px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${glowColor}, transparent 80%)`,
        }}
      />

      {/* Card Content Container */}
      <div
        className={`relative z-20 ${className.includes("flex") ? "flex flex-col h-full w-full" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
