"use client";
import ScoreTrendChart from "./ScoreTrendChart";
import { ResumeVersion } from "./types";
import { X, Download, History, RotateCcw, Trash, AlertTriangle } from "lucide-react";

interface Props {
  versions: ResumeVersion[];
  isLoadingVersions: boolean;
  isSavingVersion: boolean;
  versionError: string | null;
  newVersionName: string;
  setNewVersionName: (name: string) => void;
  handleSaveVersion: (e: React.FormEvent) => void;
  setShowHistory: (open: boolean) => void;
  compareVersion: ResumeVersion | null;
  setCompareVersion: (v: ResumeVersion | null) => void;
  handleRestoreVersion: (v: ResumeVersion) => void;
  handleDeleteVersion: (id: string) => void;
}

export default function EditorHistorySidebar({
  versions, isLoadingVersions, isSavingVersion, versionError,
  newVersionName, setNewVersionName, handleSaveVersion,
  setShowHistory, setCompareVersion,
  handleRestoreVersion, handleDeleteVersion,
}: Props) {
  return (
    <div style={{
      width: "320px", flexShrink: 0,
      borderLeft: "1px solid var(--border)",
      background: "var(--paper-card)",
      display: "flex", flexDirection: "column",
      animation: "fadeIn 0.15s ease",
      overflowY: "auto", padding: "16px", boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--ink)", fontFamily: "Instrument Sans, sans-serif" }}>
          Version History
        </h3>
        <button type="button" onClick={() => setShowHistory(false)} aria-label="Close history panel"
          style={{ background: "transparent", border: "none", color: "var(--ink-muted)", cursor: "pointer" }}>
          <X size={16} />
        </button>
      </div>

      {/* Score Trend Chart */}
      <ScoreTrendChart versions={versions} />

      {/* Save current draft */}
      <form onSubmit={handleSaveVersion} style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          <div className="flex items-center gap-1.5">
            <Download size={11} />
            <span>Create Save Point</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <input
            type="text"
            placeholder="e.g. Initial draft, Post review..."
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            required
            disabled={isSavingVersion}
            style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1.5px solid var(--accent-border)", background: "var(--paper)", color: "var(--ink)", fontSize: "12px", outline: "none" }}
          />
          <button type="submit" disabled={isSavingVersion || !newVersionName.trim()}
            style={{ background: "var(--accent)", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer", opacity: isSavingVersion ? 0.7 : 1 }}>
            {isSavingVersion ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {/* Version Timeline */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, borderBottom: "1px solid var(--border)", paddingBottom: "4px" }}>
          <div className="flex items-center gap-1.5">
            <History size={11} />
            <span>Saved Versions ({versions.length})</span>
          </div>
        </div>

        {versionError && (
          <div style={{ color: "#dc2626", fontSize: "11px", marginBottom: "10px", padding: "6px", background: "rgba(220,38,38,0.05)", borderRadius: "4px" }}>
            <div className="flex items-center gap-1.5"><AlertTriangle size={11} /><span>{versionError}</span></div>
          </div>
        )}

        {isLoadingVersions && versions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--ink-faint)", fontSize: "12px" }}>Loading version timeline...</div>
        ) : versions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--ink-faint)", fontSize: "12px" }}>No saved versions yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {versions.map((v) => (
              <div key={v.id} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", background: "var(--paper)", transition: "all 0.15s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--ink)", wordBreak: "break-word" }}>{v.version_name}</div>
                  {v.score !== null && (
                    <span style={{ background: "var(--accent-bg)", color: "var(--accent)", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px", whiteSpace: "nowrap" }}>{v.score} pts</span>
                  )}
                </div>
                <div style={{ fontSize: "10px", color: "var(--ink-muted)", marginBottom: "8px", fontFamily: "DM Mono, monospace" }}>
                  {new Date(v.created_at).toLocaleString()}
                </div>
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setCompareVersion(v)}
                    style={{ background: "transparent", color: "var(--accent)", border: "1px solid var(--accent-border)", borderRadius: "4px", padding: "3px 8px", fontSize: "10px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <History size={10} /><span>Diff</span>
                  </button>
                  <button type="button" onClick={() => handleRestoreVersion(v)}
                    style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: "4px", padding: "3px 8px", fontSize: "10px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <RotateCcw size={10} /><span>Restore</span>
                  </button>
                  <button type="button" onClick={() => handleDeleteVersion(v.id)} aria-label="Delete saved version"
                    style={{ background: "transparent", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)", borderRadius: "4px", padding: "3.5px 6px", fontSize: "10px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
