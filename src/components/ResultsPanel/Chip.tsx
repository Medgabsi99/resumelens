import React from "react";

interface ChipProps {
  label: string;
  variant: "match" | "miss";
}

export default function Chip({ label, variant }: ChipProps) {
  const colors =
    variant === "match"
      ? { bg: "rgba(16, 185, 129, 0.06)", color: "#10b981", border: "rgba(16, 185, 129, 0.15)" }
      : { bg: "rgba(239, 68, 68, 0.06)", color: "#ef4444", border: "rgba(239, 68, 68, 0.15)" };

  return (
    <span
      className="text-xs font-mono font-medium px-3 py-1 rounded-lg border"
      style={{
        background: colors.bg,
        color: colors.color,
        borderColor: colors.border,
      }}
    >
      {label}
    </span>
  );
}
