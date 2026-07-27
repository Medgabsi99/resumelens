"use client";

import React, { useRef, useState } from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string; // e.g. "rgba(139, 92, 246, 0.15)"
  enableTilt?: boolean;
  borderBeam?: boolean;
  beamColor?: string;
}

export default function SpotlightCard({
  children,
  glowColor = "rgba(139, 92, 246, 0.15)",
  enableTilt = true,
  borderBeam = false,
  beamColor = "linear-gradient(90deg, #8b5cf6, #10b981, #6366f1)",
  className = "",
  style = {},
  ...props
}: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = Math.min(5, Math.max(-5, ((y - centerY) / centerY) * -5));
      const rotateY = Math.min(5, Math.max(-5, ((x - centerX) / centerX) * 5));
      setTilt({ rotateX, rotateY });
    }
  };

  const handleMouseLeave = () => {
    setIsFocused(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const hasBg = className.includes("bg-");
  const hasBorder = className.includes("border-");
  const hasRounded = className.includes("rounded-");

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden transition-transform duration-200 cubic-bezier(0.16, 1, 0.3, 1) ${
        hasRounded ? "" : "rounded-xl"
      } ${hasBorder ? "" : "border border-white/5"} ${
        hasBg ? "" : "bg-[#0d0d15]/80 backdrop-blur-md"
      } ${className}`}
      style={{
        transform: enableTilt && isFocused
          ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.01, 1.01, 1.01)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transformStyle: "preserve-3d",
        ...style,
      }}
      {...props}
    >
      {/* Animated Conic Border Beam */}
      {borderBeam && (
        <div
          className="pointer-events-none absolute -inset-[1.5px] rounded-xl z-0 overflow-hidden"
          style={{
            background: beamColor,
            opacity: isFocused ? 0.9 : 0.4,
            transition: "opacity 0.3s ease",
            filter: "blur(0.5px)",
          }}
        />
      )}

      {/* Radial Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 z-10"
        style={{
          opacity: isFocused ? 1 : 0,
          background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
        }}
      />

      {/* Card Content Container */}
      <div className={`relative z-20 ${className.includes("flex") ? "flex flex-col h-full w-full" : ""}`}>
        {children}
      </div>
    </div>
  );
}
