import React from "react";

interface TagListProps {
  tags: string[];
  variant: "success" | "warn";
}

export default function TagList({ tags, variant }: TagListProps) {
  const colors =
    variant === "success"
      ? { bg: "rgba(16, 185, 129, 0.06)", color: "#10b981", border: "rgba(16, 185, 129, 0.15)" }
      : { bg: "rgba(245, 158, 11, 0.06)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.15)" };

  return (
    <div className="flex flex-wrap gap-2">
      {(tags || []).map((tag) => (
        <span
          key={tag}
          className="text-xs px-3.5 py-2 rounded-xl border font-medium leading-relaxed"
          style={{
            background: colors.bg,
            color: colors.color,
            borderColor: colors.border,
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
