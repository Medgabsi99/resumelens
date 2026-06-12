"use client";

interface Props {
  analysisId: string;
  hasResumeText: boolean;
}

export default function RerunButton({ analysisId, hasResumeText }: Props) {
  if (!hasResumeText) {
    return (
      <span
        title="No resume text available to re-run"
        style={{
          marginLeft: 12,
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "not-allowed",
          color: "var(--ink-faint)",
          whiteSpace: "nowrap",
          opacity: 0.5,
          fontFamily: "Instrument Sans, sans-serif",
        }}
      >
        ⟳ Re-run
      </span>
    );
  }

  return (
    <a
      href={`/?rerun=${analysisId}`}
      title="Re-run analysis with this resume"
      style={{
        marginLeft: 12,
        background: "transparent",
        border: "1px solid var(--accent-border)",
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        color: "var(--accent)",
        textDecoration: "none",
        whiteSpace: "nowrap",
        transition: "all 0.15s",
        fontFamily: "Instrument Sans, sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--accent-bg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      ⟳ Re-run
    </a>
  );
}