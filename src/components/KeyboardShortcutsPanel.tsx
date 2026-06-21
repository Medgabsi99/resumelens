"use client";

// ─── Types ───────────────────────────────────────────────────
interface ShortcutRow {
  description: string;
  keys: string[][];  // Each inner array is one key-combo, multiple combos = alternatives
}

interface ShortcutGroup {
  group: string;
  icon: string;
  rows: ShortcutRow[];
}

// ─── Shortcut registry ────────────────────────────────────────
const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    group: "Navigation",
    icon: "🧭",
    rows: [
      { description: "Open command palette", keys: [["⌘", "K"], ["Ctrl", "K"]] },
      { description: "Go to Dashboard",      keys: [["G", "D"]] },
      { description: "Go to Applications",   keys: [["G", "A"]] },
      { description: "Go to Mock Interviews",keys: [["G", "I"]] },
      { description: "Go to ATS Scanner",    keys: [["G", "S"]] },
      { description: "Go to Salary Negotiator", keys: [["G", "N"]] },
      { description: "Go to Learning Paths", keys: [["G", "L"]] },
      { description: "Go to Tailor Sandbox", keys: [["G", "T"]] },
      { description: "Go to Settings",       keys: [["G", "E"]] },
      { description: "New Resume Analysis",  keys: [["G", "H"]] },
    ],
  },
  {
    group: "Interface",
    icon: "🎨",
    rows: [
      { description: "Show keyboard shortcuts", keys: [["?"]] },
      { description: "Toggle dark / light mode", keys: [["T"]] },
      { description: "Close modal / dialog",     keys: [["Esc"]] },
    ],
  },
  {
    group: "Command Palette",
    icon: "🔍",
    rows: [
      { description: "Navigate results",  keys: [["↑"], ["↓"]] },
      { description: "Execute command",   keys: [["↵"]] },
      { description: "Close palette",     keys: [["Esc"]] },
    ],
  },
];

// ─── Kbd badge ────────────────────────────────────────────────
function Kbd({ children }: { children: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 24,
        height: 22,
        padding: "0 6px",
        background: "var(--paper-warm)",
        border: "1px solid var(--border-strong)",
        borderBottom: "2px solid var(--border-strong)",
        borderRadius: 6,
        fontFamily: "DM Mono, monospace",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--ink-muted)",
        lineHeight: 1,
        boxShadow: "0 1px 0 var(--border)",
      }}
    >
      {children}
    </span>
  );
}

// ─── Combo (keys in a sequence / combo) ──────────────────────
function Combo({ keys }: { keys: string[] }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {keys.map((k, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          {i > 0 && (
            <span
              style={{
                fontSize: 10,
                color: "var(--ink-faint)",
                fontFamily: "DM Mono, monospace",
                margin: "0 1px",
              }}
            >
              then
            </span>
          )}
          <Kbd>{k}</Kbd>
        </span>
      ))}
    </span>
  );
}

// ─── Main panel ───────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsPanel({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(5px)",
          zIndex: 9998,
          animation: "kspFadeIn 0.12s ease",
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Keyboard shortcuts"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(560px, calc(100vw - 32px))",
          maxHeight: "80vh",
          background: "var(--paper-card)",
          border: "1px solid var(--accent-border)",
          borderRadius: 18,
          boxShadow:
            "0 32px 64px -16px rgba(0,0,0,0.45), 0 0 60px -20px var(--brand-glow)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "kspSlideUp 0.18s cubic-bezier(0.16,1,0.3,1)",
          fontFamily: "Instrument Sans, system-ui, sans-serif",
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes kspFadeIn  { from { opacity:0 } to { opacity:1 } }
          @keyframes kspSlideUp {
            from { opacity:0; transform:translate(-50%,-48%) scale(0.96); }
            to   { opacity:1; transform:translate(-50%,-50%) scale(1);    }
          }
        `}} />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "var(--accent-bg)",
                border: "1px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
              }}
            >
              ⌨️
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--ink)",
                  lineHeight: 1.2,
                }}
              >
                Keyboard Shortcuts
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 1 }}>
                Press{" "}
                <span
                  style={{
                    fontFamily: "DM Mono, monospace",
                    background: "var(--paper-warm)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "0 4px",
                    fontSize: 10,
                  }}
                >
                  ?
                </span>{" "}
                anytime to open this panel
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close shortcuts panel"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--ink-faint)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: "4px 6px",
              borderRadius: 6,
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--ink)";
              e.currentTarget.style.background = "var(--paper-warm)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--ink-faint)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "12px 0 16px" }}>
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.group} style={{ marginBottom: 8 }}>
              {/* Group heading */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 20px 4px",
                  fontSize: 10,
                  fontFamily: "DM Mono, monospace",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--accent)",
                }}
              >
                <span>{group.icon}</span>
                {group.group}
              </div>

              {/* Rows */}
              {group.rows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 20px",
                    gap: 16,
                    borderRadius: 0,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--accent-bg)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Description */}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--ink-muted)",
                      flex: 1,
                    }}
                  >
                    {row.description}
                  </span>

                  {/* Key combos — separated by "or" if multiple alternatives */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    {row.keys.map((combo, ci) => (
                      <span
                        key={ci}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {ci > 0 && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--ink-faint)",
                              fontFamily: "DM Mono, monospace",
                            }}
                          >
                            or
                          </span>
                        )}
                        <Combo keys={combo} />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid var(--border)",
            background: "var(--paper-warm)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>
            Shortcuts work anywhere in the dashboard
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              fontFamily: "DM Mono, monospace",
            }}
          >
            <span
              style={{
                background: "var(--paper-card)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "1px 5px",
                marginRight: 4,
              }}
            >
              Esc
            </span>
            to close
          </span>
        </div>
      </div>
    </>
  );
}
