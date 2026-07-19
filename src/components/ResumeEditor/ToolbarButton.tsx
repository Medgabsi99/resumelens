import React from "react";

export interface ToolbarButtonProps {
  onClick: () => void;
  label: React.ReactNode;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger";
  active?: boolean;
}

export default function ToolbarButton({
  onClick,
  label,
  disabled = false,
  variant = "default",
  active = true,
}: ToolbarButtonProps) {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: "transparent",
      color: "var(--ink)",
      border: "1px solid var(--border)",
    },
    primary: {
      background: "var(--accent)",
      color: "white",
      border: "none",
    },
    danger: {
      background: "transparent",
      color: active ? "#7a2020" : "var(--ink-faint)",
      border: `1px solid ${active ? "rgba(122,32,32,0.3)" : "var(--border)"}`,
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Instrument Sans, sans-serif",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
