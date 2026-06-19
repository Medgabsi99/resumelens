"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { AnalysisResult } from "@/types";
import ResultsPanel from "@/components/ResultsPanel";
import UpgradeModal from "@/components/UpgradeModal";
import ThemeToggle from "@/components/ThemeToggle";
import { createBrowserClient } from "@/lib/supabase";
import AuroraBackground from "@/components/AuroraBackground";
import ConfettiCannon from "@/components/ConfettiCannon";

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [profile, setProfile] = useState<{ plan: string; analyses_used: number; analyses_limit: number } | null>(null);
  // Increments each time a milestone score is achieved → triggers confetti
  const [confettiKey, setConfettiKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Load session + handle ?rerun= ──────────────────────
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
        
        // Fetch active plan and quota limits from database profile
        const { data } = await supabase
          .from("profiles")
          .select("plan, analyses_used, analyses_limit")
          .eq("id", session.user.id)
          .single();
          
        if (data) {
          setProfile(data);
        }
      }
      setIsSessionLoaded(true);
    });

    // Handle ?rerun= parameter — pre-populate form from a past analysis
    const rerunId = new URLSearchParams(window.location.search).get("rerun");
    if (rerunId) {
      fetch(`/api/analyses/${rerunId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setResumeText(data.data.resumeText || "");
            setJobDescription(data.data.jobDescription || "");
            setTargetRole(data.data.targetRole || "");
            // Clean the URL so subsequent refreshes don't re-trigger
            window.history.replaceState({}, "", "/");
          }
        })
        .catch(() => {
          // silently fail — user can paste manually
        });
    }
  }, []);

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
  const [extractedText, setExtractedText] = useState("");

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
    setExtractedText("");

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

      if (data.extractedText) {
        setExtractedText(data.extractedText);
      } else if (!uploadedFile) {
        setExtractedText(resumeText);
      }

      if (data.requiresUpgrade) {
        setPreview(data.preview);
        setRequiresUpgrade(true);
        setShowUpgradeModal(true);
      } else {
        setResult(data.data);
        // Fire confetti if score crosses a milestone
        if (data.data?.score >= 80) {
          setConfettiKey((k) => k + 1);
        }
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Aurora animated background */}
      <AuroraBackground />

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b flex flex-col md:flex-row md:items-center justify-between py-4 px-6 md:px-12 transition-all duration-300"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center justify-between w-full md:w-auto">
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>
            Resume<span style={{ color: "var(--accent)" }}>Lens</span>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-ink hover:text-accent transition-colors focus:outline-none p-1"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <ThemeToggle />
          <a
            href="/pricing"
            className="text-sm text-ink-muted hover:text-accent font-medium no-underline transition-colors duration-200"
          >
            Pricing
          </a>
          {isSessionLoaded && userEmail ? (
            <>
              <a
                href="/dashboard"
                className="text-sm text-ink-muted hover:text-accent font-medium no-underline flex items-center gap-2 transition-colors duration-200"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Dashboard
              </a>
              <a
                href="/api/auth/signout"
                className="text-sm font-semibold text-ink-muted hover:text-accent border border-border hover:border-accent-border px-4 py-2 rounded-xl no-underline transition-all duration-200"
                style={{ background: "var(--paper-card)" }}
              >
                Sign out
              </a>
            </>
          ) : isSessionLoaded ? (
            <a
              href="/login"
              className="text-sm font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-xl no-underline transition-all duration-200 shadow-sm"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
              }}
            >
              Sign in
            </a>
          ) : (
            <div className="w-16 h-8 bg-border/20 animate-pulse rounded-xl" />
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-4 mt-4 pt-4 border-t border-border w-full animate-fadeIn">
            <a
              href="/pricing"
              className="text-sm text-ink-muted hover:text-accent font-medium no-underline transition-colors duration-200 py-1"
            >
              Pricing
            </a>
            {isSessionLoaded && userEmail ? (
              <>
                <a
                  href="/dashboard"
                  className="text-sm text-ink-muted hover:text-accent font-medium no-underline flex items-center gap-2 transition-colors duration-200 py-1"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Dashboard
                </a>
                <a
                  href="/api/auth/signout"
                  className="text-sm font-semibold text-ink-muted hover:text-accent border border-border hover:border-accent-border px-4 py-2 rounded-xl no-underline transition-all duration-200 text-center"
                  style={{ background: "var(--paper-card)" }}
                >
                  Sign out
                </a>
              </>
            ) : isSessionLoaded ? (
              <a
                href="/login"
                className="text-sm font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-2.5 rounded-xl no-underline transition-all duration-200 shadow-sm text-center"
                style={{
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                }}
              >
                Sign in
              </a>
            ) : (
              <div className="h-8 bg-border/20 animate-pulse rounded-xl" />
            )}
          </div>
        )}
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-16">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1
            className="font-display tracking-tight leading-tight mb-4"
            style={{
              fontSize: "clamp(36px, 5.5vw, 60px)",
              letterSpacing: "-1px",
            }}
          >
            Your resume, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-indigo-500 italic">honestly reviewed</span>
          </h1>
          <p className="text-ink-muted text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Get instant, deep analysis on your resume. Identify ATS keywords gaps, receive tailored rewrite suggestions, and match yourself perfectly to target jobs.
          </p>
        </div>

        {/* Quota indicator */}
        {isSessionLoaded && userEmail && profile && (
          <div className="glass-card max-w-xl mx-auto mb-10 p-4 rounded-2xl flex items-center justify-between text-sm">
            <div className="flex items-center gap-2.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: profile.plan === "free" ? "var(--accent)" : "#10b981",
                  boxShadow: `0 0 10px ${profile.plan === "free" ? "var(--accent)" : "#10b981"}`,
                }}
              />
              <span className="text-ink-muted">
                Plan:{" "}
                <strong
                  className="capitalize font-semibold"
                  style={{ color: profile.plan === "free" ? "var(--accent)" : "#10b981" }}
                >
                  {profile.plan === "free" ? "Free Tier" : profile.plan === "monthly" ? "Pro Monthly" : "Lifetime Pro"}
                </strong>
              </span>
            </div>
            <div>
              {profile.plan === "free" ? (
                <span className="text-ink-muted">
                  Quota: <strong className="text-ink">{Math.max(0, profile.analyses_limit - profile.analyses_used)} / {profile.analyses_limit}</strong> remaining
                </span>
              ) : (
                <strong className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>Unlimited Reviews</span>
                  <span>✨</span>
                </strong>
              )}
            </div>
          </div>
        )}

        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Left — Resume */}
          <Panel label="Your Resume">
            {/* Drop zone */}
            <div
              {...getRootProps()}
              className="border-2 border-dashed rounded-xl p-6 cursor-pointer text-center flex flex-col items-center justify-center gap-2 transition-all duration-300"
              style={{
                borderColor: isDragActive ? "var(--accent)" : "var(--border-strong)",
                background: isDragActive ? "var(--accent-bg)" : "var(--paper-warm)",
              }}
            >
              <input {...getInputProps()} />
              <div className="text-2xl mb-1">{fileName ? "📄" : "📤"}</div>
              <p className="text-xs text-ink-muted font-mono leading-relaxed max-w-xs mx-auto">
                {fileName
                  ? `${fileName}`
                  : isDragActive
                  ? "Drop your file here..."
                  : "Drop PDF, DOCX, or TXT here, or click to browse"}
              </p>
            </div>

            <div className="relative my-5 text-center">
              <span className="absolute inset-y-1/2 left-0 right-0 h-px" style={{ background: "var(--border)" }} />
              <span className="relative px-3 font-mono text-[10px] tracking-widest text-ink-faint uppercase" style={{ background: "var(--paper-card)" }}>
                or paste resume text
              </span>
            </div>

            <textarea
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (e.target.value) { setUploadedFile(null); setFileName(null); }
              }}
              placeholder="Paste the raw text of your resume here..."
              className="premium-input w-full min-h-[220px] font-mono text-xs leading-relaxed"
            />
            <div className="flex justify-between items-center mt-1.5 px-0.5">
              <span className="text-[10px] font-mono text-ink-faint">
                {resumeText.length > 0 ? `${resumeText.length.toLocaleString()} characters` : ""}
              </span>
              {resumeText.length > 500 && (
                <span className={`text-[10px] font-mono font-semibold ${resumeText.length >= 4000 ? "text-emerald-500" : resumeText.length >= 1500 ? "text-amber-500" : "text-ink-faint"}`}>
                  {resumeText.length >= 4000 ? "✓ Great length" : resumeText.length >= 1500 ? "Good — add more for best results" : "Keep going…"}
                </span>
              )}
            </div>
          </Panel>

          {/* Right — Job context */}
          <Panel label="Job Context (recommended)">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here. Enabling this unlocks personalized matching, ATS gap analysis, and tailored rewrites..."
              className="premium-input w-full min-h-[220px] font-mono text-xs leading-relaxed mb-4"
            />
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder='Target role, e.g. "Senior Frontend Developer"'
              className="premium-input w-full"
            />
          </Panel>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center justify-center mb-12">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="btn-gradient px-8 py-3.5 rounded-xl text-base font-semibold min-w-[200px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span>{LOADING_STEPS[loadingStep]}</span>
              </span>
            ) : (
              <span>Analyze Resume →</span>
            )}
          </button>

          {error && (
            <p className="text-red-500 font-medium text-sm mt-4 text-center max-w-md bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
              {error}
            </p>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "var(--accent)",
                    animation: `pulse-dot 1.4s ease ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <>
            {confettiKey > 0 && (
              <ConfettiCannon score={result.score} trigger={confettiKey % 2 === 1} />
            )}
            <ResultsPanel
              result={result}
              hasJD={hasJD}
              resumeText={extractedText}
              jobDescription={jobDescription}
              targetRole={targetRole}
            />
          </>
        )}

        {/* Upgrade preview */}
        {requiresUpgrade && preview && !showUpgradeModal && (
          <div className="glass-card max-w-xl mx-auto p-8 rounded-2xl text-center shadow-premium bg-gradient-to-b from-paper-card to-paper-warm/20 mt-8">
            <div className="font-display text-5xl text-accent mb-2">
              {preview.score}
            </div>
            <p className="text-ink-muted mb-6 text-sm leading-relaxed max-w-sm mx-auto">{preview.summary}</p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-gradient px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
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
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full bg-paper-card">
      <div
        className="px-5 py-3 border-b flex items-center gap-2 bg-paper-warm/40"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
        <span className="text-[10px] font-mono font-bold tracking-wider text-ink-muted uppercase">
          {label}
        </span>
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between">{children}</div>
    </div>
  );
}
