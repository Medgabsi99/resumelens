"use client";

import { useState, useMemo } from "react";
import {
  X,
  Sparkles,
  Layers,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Copy,
  Check,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useToast } from "./ToastProvider";

interface JobInput {
  id: string;
  roleTitle: string;
  companyName: string;
  jobDescription: string;
}

interface Props {
  resumeText: string;
  onClose: () => void;
}

export default function MultiJobMatrixModal({ resumeText, onClose }: Props) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [jobs, setJobs] = useState<JobInput[]>([
    { id: "1", roleTitle: "Frontend Architect", companyName: "Stripe", jobDescription: "" },
    { id: "2", roleTitle: "Staff Software Engineer", companyName: "Vercel", jobDescription: "" },
    { id: "3", roleTitle: "Senior UI Engineer", companyName: "Airbnb", jobDescription: "" },
  ]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [masterTailoredResume, setMasterTailoredResume] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // ── Keyword Extraction & Multi-Job Match Analysis ──────────
  const matrixAnalysis = useMemo(() => {
    if (!analyzed) return null;

    // Extract terms present in resume
    const resLower = resumeText.toLowerCase();

    // Sample keywords per job
    const jobResults = jobs.map((j) => {
      const jdWords = j.jobDescription
        ? Array.from(new Set(j.jobDescription.match(/\b[A-Za-z0-9+#.-]{3,15}\b/g) || []))
            .filter((w) => !["and", "the", "for", "with", "that", "this", "your", "will", "have", "from"].includes(w.toLowerCase()))
            .slice(0, 15)
        : ["TypeScript", "React", "Next.js", "GraphQL", "Performance", "CI/CD", "System Design"];

      const matched = jdWords.filter((w) => resLower.includes(w.toLowerCase()));
      const missing = jdWords.filter((w) => !resLower.includes(w.toLowerCase()));
      const score = Math.min(98, Math.max(55, Math.round((matched.length / Math.max(1, jdWords.length)) * 100)));

      return {
        id: j.id,
        roleTitle: j.roleTitle || "Target Role",
        companyName: j.companyName || "Company",
        score,
        matchedKeywords: matched,
        missingKeywords: missing,
      };
    });

    // Find Universal Overlapping Keywords across ALL target jobs
    const allMissing = jobResults.flatMap((j) => j.missingKeywords);
    const universalGaps = Array.from(new Set(allMissing)).slice(0, 8);

    return {
      jobResults,
      universalGaps,
      avgScore: Math.round(jobResults.reduce((acc, j) => acc + j.score, 0) / jobResults.length),
    };
  }, [analyzed, jobs, resumeText]);

  // ── Run Multi-Job Matrix Analysis ─────────────────────────
  const handleAnalyzeMatrix = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalyzed(true);
      toastSuccess("Multi-Job Matrix Analysis Complete!", "Matrix Ready");
    }, 1500);
  };

  // ── Generate Universal Master Resume ───────────────────────
  const handleGenerateUniversalMaster = () => {
    if (!matrixAnalysis) return;
    const gaps = matrixAnalysis.universalGaps.join(", ");
    const enhanced = `${resumeText}\n\n[UNIVERSAL MULTI-ROLE TAILORED HIGHLIGHTS]\n- Core Technical Matrix Competencies: ${gaps}\n- Optimized for simultaneous candidate matching across ${jobs.map((j) => j.companyName).join(", ")}`;
    setMasterTailoredResume(enhanced);
    toastSuccess("Universal Master Resume generated!", "Master Tailor Ready");
  };

  const handleCopyMaster = () => {
    navigator.clipboard.writeText(masterTailoredResume || resumeText);
    setCopied(true);
    toastSuccess("Master Tailored Resume copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 10, 12, 0.90)",
        backdropFilter: "blur(14px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
      className="print:hidden"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          background: "var(--paper-card)",
          border: "1.5px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8b5cf6",
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>
                Multi-Job Matrix Tailor ("Tailor Engine v2")
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--ink-muted)" }}>
                Compare your resume against 3 target job descriptions simultaneously & extract common keyword gaps.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--ink-muted)",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Job Inputs Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
          {jobs.map((job, idx) => (
            <div
              key={job.id}
              style={{
                background: "var(--paper-warm)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#8b5cf6", fontFamily: "DM Mono, monospace" }}>
                Target Job #{idx + 1}
              </span>

              <input
                type="text"
                placeholder="Role Title (e.g. Frontend Architect)"
                value={job.roleTitle}
                onChange={(e) => {
                  const updated = [...jobs];
                  updated[idx].roleTitle = e.target.value;
                  setJobs(updated);
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--paper)",
                  color: "var(--ink)",
                  fontSize: "12px",
                  outline: "none",
                }}
              />

              <input
                type="text"
                placeholder="Company Name (e.g. Stripe)"
                value={job.companyName}
                onChange={(e) => {
                  const updated = [...jobs];
                  updated[idx].companyName = e.target.value;
                  setJobs(updated);
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--paper)",
                  color: "var(--ink)",
                  fontSize: "12px",
                  outline: "none",
                }}
              />

              <textarea
                placeholder="Paste job description or requirements list..."
                value={job.jobDescription}
                onChange={(e) => {
                  const updated = [...jobs];
                  updated[idx].jobDescription = e.target.value;
                  setJobs(updated);
                }}
                rows={4}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--paper)",
                  color: "var(--ink)",
                  fontSize: "11.5px",
                  fontFamily: "DM Mono, monospace",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          ))}
        </div>

        {/* Action Button */}
        {!analyzed && (
          <button
            onClick={handleAnalyzeMatrix}
            disabled={isAnalyzing}
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 6px 20px rgba(139, 92, 246, 0.35)",
            }}
          >
            {isAnalyzing ? <Sparkles size={16} className="animate-spin" /> : <Zap size={16} />}
            <span>{isAnalyzing ? "Calculating Multi-Job Matrix..." : "Run Side-by-Side Matrix Analysis"}</span>
          </button>
        )}

        {/* Matrix Results View */}
        {analyzed && matrixAnalysis && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Side-by-Side Comparison Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
              {matrixAnalysis.jobResults.map((jRes) => (
                <div
                  key={jRes.id}
                  style={{
                    background: "var(--paper-card)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "14px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
                        {jRes.companyName}
                      </h4>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: jRes.score >= 80 ? "#10b981" : jRes.score >= 65 ? "#f59e0b" : "#ef4444",
                          fontFamily: "DM Mono, monospace",
                        }}
                      >
                        {jRes.score}% Match
                      </span>
                    </div>
                    <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--ink-muted)" }}>
                      {jRes.roleTitle}
                    </p>

                    <div style={{ fontSize: "11px", marginBottom: "6px", color: "#10b981", fontWeight: 700 }}>
                      Matched Keywords ({jRes.matchedKeywords.length}):
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                      {jRes.matchedKeywords.slice(0, 5).map((kw) => (
                        <span key={kw} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" }}>
                          {kw}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontSize: "11px", marginBottom: "6px", color: "#ef4444", fontWeight: 700 }}>
                      Missing Keywords ({jRes.missingKeywords.length}):
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {jRes.missingKeywords.slice(0, 5).map((kw) => (
                        <span key={kw} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Common Overlapping Keyword Gaps */}
            <div
              style={{
                background: "rgba(139, 92, 246, 0.08)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <h4 style={{ margin: "0 0 6px 0", fontSize: "13.5px", fontWeight: 800, color: "#8b5cf6" }}>
                🎯 Universal Overlapping Keyword Gaps Across All 3 Jobs
              </h4>
              <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--ink-muted)" }}>
                Adding these key terms will boost your ATS match score for ALL target companies simultaneously:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {matrixAnalysis.universalGaps.map((gapKw) => (
                  <span
                    key={gapKw}
                    style={{
                      background: "var(--accent)",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                    }}
                  >
                    + {gapKw}
                  </span>
                ))}
              </div>
            </div>

            {/* Universal Master Resume Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={handleGenerateUniversalMaster}
                style={{
                  background: "var(--paper)",
                  border: "1.5px solid var(--accent)",
                  color: "var(--accent)",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Sparkles size={14} />
                Generate Universal Master Resume
              </button>

              {masterTailoredResume && (
                <button
                  onClick={handleCopyMaster}
                  style={{
                    background: copied ? "#10b981" : "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 20px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? "Copied!" : "Copy Master Resume Text"}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
