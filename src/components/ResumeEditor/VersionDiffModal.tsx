import { useMemo } from "react";
import * as Diff from "diff";
import { ResumeVersion } from "./types";

interface VersionDiffModalProps {
  version: ResumeVersion;
  currentText: string;
  onClose: () => void;
  onRestore: () => void;
}

export default function VersionDiffModal({
  version,
  currentText,
  onClose,
  onRestore,
}: VersionDiffModalProps) {
  const diffs = useMemo(() => {
    return Diff.diffWordsWithSpace(version.resume_text, currentText);
  }, [version.resume_text, currentText]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        background: "var(--paper-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "850px",
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--accent-bg)",
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--ink)",
              fontFamily: "Instrument Sans, sans-serif",
            }}>
              Comparing: {version.version_name}
            </h3>
            <p style={{
              margin: "4px 0 0 0",
              fontSize: "11px",
              color: "var(--ink-muted)",
              fontFamily: "DM Mono, monospace",
            }}>
              Saved on {new Date(version.created_at).toLocaleString()} • Score: {version.score ?? "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--ink-muted)",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            &times;
          </button>
        </div>

        {/* Legend */}
        <div style={{
          padding: "10px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--paper-warm)",
          display: "flex",
          gap: "16px",
          fontSize: "11px",
          fontWeight: 600,
          fontFamily: "Instrument Sans, sans-serif",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: "12px",
              height: "12px",
              background: "#ffebe9",
              border: "1px solid #ffc1c1",
              borderRadius: "3px",
              display: "inline-block",
            }} />
            <span style={{ color: "#b91c1c" }}>Deleted from Snapshot</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: "12px",
              height: "12px",
              background: "#e6ffec",
              border: "1px solid #abf2af",
              borderRadius: "3px",
              display: "inline-block",
            }} />
            <span style={{ color: "#15803d" }}>Added in Active Editor</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: "12px",
              height: "12px",
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              display: "inline-block",
            }} />
            <span style={{ color: "var(--ink-muted)" }}>Unchanged</span>
          </div>
        </div>

        {/* Diff view */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "24px",
          background: "var(--paper)",
          fontFamily: "DM Mono, monospace",
          fontSize: "13px",
          lineHeight: "1.7",
          whiteSpace: "pre-wrap",
        }}>
          {diffs.map((part, index) => {
            let style: React.CSSProperties = {};
            if (part.added) {
              style = {
                background: "#e6ffec",
                color: "#15803d",
                textDecoration: "none",
                fontWeight: 600,
              };
            } else if (part.removed) {
              style = {
                background: "#ffebe9",
                color: "#b91c1c",
                textDecoration: "line-through",
              };
            }
            return (
              <span key={index} style={style}>
                {part.value}
              </span>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          background: "var(--paper-card)",
        }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "var(--ink)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to restore "${version.version_name}"? This will overwrite your current draft.`)) {
                onRestore();
                onClose();
              }
            }}
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px var(--brand-glow)",
            }}
          >
            ↺ Restore This Version
          </button>
        </div>
      </div>
    </div>
  );
}
