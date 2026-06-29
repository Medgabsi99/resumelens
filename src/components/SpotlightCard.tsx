"use client";

import React, { useRef, useState } from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string; // e.g. "rgba(139, 92, 246, 0.15)"
}

export default function SpotlightCard({
  children,
  glowColor = "rgba(139, 92, 246, 0.15)",
  className = "",
  style = {},
  ...props
}: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const hasBg = className.includes("bg-");
  const hasBorder = className.includes("border-");
  const hasRounded = className.includes("rounded-");

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={`relative overflow-hidden transition-all duration-300 ${
        hasRounded ? "" : "rounded-xl"
      } ${hasBorder ? "" : "border border-white/5"} ${
        hasBg ? "" : "bg-[#0d0d15]/80 backdrop-blur-md"
      } ${className}`}
      style={{
        ...style,
      }}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: isFocused ? 1 : 0,
          background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
        }}
      />
      <div className={`relative z-10 ${className.includes("flex") ? "flex flex-col h-full w-full" : ""}`}>{children}</div>
    </div>
  );
}
