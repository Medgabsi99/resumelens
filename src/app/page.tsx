"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { AnalysisResult } from "@/types";
import ResultsPanel from "@/components/ResultsPanel";
import UpgradeModal from "@/components/UpgradeModal";

const LOADING_STEPS = [
  "Reading your resume...",
  "Analyzing structure and impact...",
  "Matching against job requirements...",
  "Generating rewrite suggestions...",
  "Almost done...",
];

export default function HomePage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [preview, setPreview] = useState<{ score: number; summary: string; strengths: string[] } | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ── File drop ────────────────────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setUploadedFile(file);
    setFileName(file.name);
    setResumeText(""); // clear text if file is uploaded
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  // ── Analyze ──────────────────────────────────────────────
  async function handleAnalyze() {
    if (!resumeText.trim() && !uploadedFile) {
      setError("Please paste your resume text or upload a file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setPreview(null);
    setRequiresUpgrade(false);
    setLoadingStep(0);

    // Cycle loading messages
    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2800);

    try {
      let response: Response;

      if (uploadedFile) {
        // Multipart upload
        const form = new FormData();
        form.append("file", uploadedFile);
        if (jobDescription) form.append("jobDescription", jobDescription);
        if (targetRole) form.append("targetRole", targetRole);
        response = await fetch("/api/analyze", { method: "POST", body: form });
      } else {
        // JSON text
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText, jobDescription, targetRole }),
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        // 401 = not logged in
        if (response.status === 401) {
          window.location.href = "/login?next=/";
          return;
        }
        setError(data.error || "Something went wrong.");
        return;
      }

      if (data.requiresUpgrade) {
        setPreview(data.preview);
        setRequiresUpgrade(true);
        setShowUpgradeModal(true);
      } else {
        setResult(data.data);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  const hasJD = !!jobDescription.trim();

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      {/* Nav */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--paper-card)",
        }}
      >
        <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 22 }}>
          Resume<em style={{ color: "var(--accent)" }}>Lens</em>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/pricing" style={{ fontSize: 13, color: "var(--ink-muted)", textDecoration: "none" }}>
            Pricing
          </a>
          <a href="/dashboard" style={{ fontSize: 13, color: "var(--ink-muted)", textDecoration: "none" }}>
            Dashboard
          </a>
          <a
            href="/login"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--accent)",
              textDecoration: "none",
              border: "1px solid var(--accent-border)",
              padding: "6px 14px",
              borderRadius: 8,
            }}
          >
            Sign in
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: "clamp(32px, 5vw, 52px)",
              lineHeight: 1.1,
              marginBottom: 14,
              letterSpacing: "-0.5px",
            }}
          >
            Your resume, <em style={{ color: "var(--accent)" }}>honestly reviewed</em>
          </h1>
          <p style={{ color: "var(--ink-muted)", fontSize: 17, maxWidth: 480, margin: "0 auto" }}>
            Paste your resume, add a job description, and get a detailed AI analysis with a score, strengths, weaknesses, and line-by-line rewrites.
          </p>
        </div>

        {/* Input Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Left — Resume */}
          <Panel label="Your Resume">
            {/* Drop zone */}
            <div
              {...getRootProps()}
              style={{
                border: `1.5px dashed ${isDragActive ? "var(--accent)" : "var(--border-strong)"}`,
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 12,
                cursor: "pointer",
                background: isDragActive ? "var(--accent-bg)" : "var(--paper-warm)",
                transition: "all 0.15s",
                textAlign: "center",
              }}
            >
              <input {...getInputProps()} />
              <p style={{ fontSize: 12.5, color: "var(--ink-muted)", fontFamily: "DM Mono, monospace" }}>
                {fileName
                  ? `📄 ${fileName}`
                  : isDragActive
                  ? "Drop it here..."
                  : "Drop PDF, DOCX, or TXT — or click to browse"}
              </p>
            </div>

            <div style={{ fontSize: 11, color: "var(--ink-faint)", textAlign: "center", marginBottom: 10, fontFamily: "DM Mono, monospace" }}>
              — or paste text below —
            </div>

            <textarea
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (e.target.value) { setUploadedFile(null); setFileName(null); }
              }}
              placeholder="Paste your resume here — plain text, all sections..."
              style={{
                width: "100%",
                minHeight: 260,
                resize: "vertical",
                border: "1.5px solid var(--border)",
                borderRadius: 10,
                padding: "12px 14px",
                fontFamily: "DM Mono, monospace",
                fontSize: 12.5,
                lineHeight: 1.7,
                background: "var(--paper)",
                color: "var(--ink)",
                outline: "none",
                display: "block",
              }}
            />
          </Panel>

          {/* Right — Job context */}
          <Panel label="Job Context (recommended)">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here. Enables keyword gap analysis and targeted feedback..."
              style={{
                width: "100%",
                minHeight: 260,
                resize: "vertical",
                border: "1.5px solid var(--border)",
                borderRadius: 10,
                padding: "12px 14px",
                fontFamily: "DM Mono, monospace",
                fontSize: 12.5,
                lineHeight: 1.7,
                background: "var(--paper)",
                color: "var(--ink)",
                outline: "none",
                display: "block",
                marginBottom: 12,
              }}
            />
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder='Target role, e.g. "Senior Product Designer"'
              style={{
                width: "100%",
                border: "1.5px solid var(--border)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13.5,
                fontFamily: "Instrument Sans, sans-serif",
                background: "var(--paper)",
                color: "var(--ink)",
                outline: "none",
              }}
            />
          </Panel>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              background: loading ? "var(--ink-faint)" : "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "13px 32px",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "Instrument Sans, sans-serif",
              transition: "opacity 0.15s",
              minWidth: 180,
            }}
          >
            {loading ? LOADING_STEPS[loadingStep] : "Analyze Resume →"}
          </button>
        </div>

        {error && (
          <p style={{ color: "#7a2020", textAlign: "center", fontSize: 13.5, marginTop: 8 }}>
            {error}
          </p>
        )}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  animation: `pulse-dot 1.4s ease ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        {/* Results */}
        {result && <ResultsPanel result={result} hasJD={hasJD} />}

        {/* Upgrade preview */}
        {requiresUpgrade && preview && !showUpgradeModal && (
          <div
            style={{
              background: "var(--paper-card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 42, color: "var(--accent)", marginBottom: 4 }}>
              {preview.score}
            </div>
            <p style={{ color: "var(--ink-muted)", marginBottom: 16, fontSize: 14 }}>{preview.summary}</p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              style={{
                background: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Unlock Full Report →
            </button>
          </div>
        )}
      </div>

      {showUpgradeModal && (
        <UpgradeModal preview={preview} onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid var(--border)",
          background: "var(--paper-warm)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
        <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}
