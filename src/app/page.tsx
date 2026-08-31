"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { runAtsChecks } from "@/lib/atsRulesChecker";
import { useAutoSaveDraft } from "@/lib/useAutoSaveDraft";
import { AnalysisResult, ResumeStyleTokens } from "@/types";
import { DEFAULT_STYLE_TOKENS } from "@/lib/resumeStyleDefaults";

import ResultsPanel from "@/components/ResultsPanel";
import UpgradeModal from "@/components/UpgradeModal";
import ThemeToggle from "@/components/ThemeToggle";
import { createBrowserClient } from "@/lib/supabase";
import AuroraBackground from "@/components/AuroraBackground";
import ConfettiCannon from "@/components/ConfettiCannon";
import ParsingProgressVisualizer from "@/components/ParsingProgressVisualizer";
import HomepageMarketing from "@/components/HomepageMarketing";
import InteractiveResumeSandbox from "@/components/InteractiveResumeSandbox";
import SpotlightCard from "@/components/SpotlightCard";
import { detectAtsVendorFromUrl } from "@/lib/atsFingerprinter";
import { DEMO_ARCHETYPES } from "@/lib/sampleDemoData";
import DemoConversionBanner from "@/components/DemoConversionBanner";
import SocialProofTicker from "@/components/SocialProofTicker";
import CommandPalette from "@/components/CommandPalette";
import {
  FileText,
  Upload,
  Sparkles,
  Menu,
  X,
  Play,
  ArrowRight,
  TrendingUp,
  Zap,
  ShieldCheck,
  Search,
} from "lucide-react";

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
  const [jobUrl, setJobUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeMode, setScrapeMode] = useState<"paste" | "url">("paste");

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoArchetype, setDemoArchetype] = useState<"swe" | "pm" | "ml">("swe");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [preview, setPreview] = useState<{
    score: number;
    summary: string;
    strengths: string[];
  } | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [profile, setProfile] = useState<{
    plan: string;
    analyses_used: number;
    analyses_limit: number;
  } | null>(null);
  // Increments each time a milestone score is achieved → triggers confetti
  const [confettiKey, setConfettiKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resumeStyleTokens, setResumeStyleTokens] =
    useState<ResumeStyleTokens>(DEFAULT_STYLE_TOKENS);

  const { hasSavedDraft, savedDraft, clearSavedDraft } = useAutoSaveDraft(
    resumeText,
    jobDescription,
    targetRole
  );

  const handleRestoreDraft = () => {
    if (savedDraft) {
      setResumeText(savedDraft.resumeText || "");
      setJobDescription(savedDraft.jobDescription || "");
      setTargetRole(savedDraft.targetRole || "");
      clearSavedDraft();
    }
  };

  // ── Global Cmd+K Command Palette Shortcut ────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Load session + handle ?rerun= ──────────────────────
  useEffect(() => {
    try {
      const supabase = createBrowserClient();
      supabase.auth
        .getSession()
        .then(async ({ data: { session } = { session: null } }) => {
          if (session?.user) {
            setUserEmail(session.user.email || null);

            // Fetch active plan and quota limits from database profile
            try {
              const { data } = await supabase
                .from("profiles")
                .select("plan, analyses_used, analyses_limit")
                .eq("id", session.user.id)
                .single();

              if (data) {
                setProfile(data);
              }
            } catch {
              // Non-critical profile load fallback
            }
          }
          setIsSessionLoaded(true);
        })
        .catch(() => {
          setIsSessionLoaded(true);
        });
    } catch {
      setIsSessionLoaded(true);
    }

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

  const handleLoadSample = () => {
    const sampleResume = `ALEX MORGAN
San Francisco, CA • (555) 234-5678 • alex.morgan@email.com • linkedin.com/in/alexmorgan

PROFESSIONAL SUMMARY
Senior Full Stack Engineer with 6+ years of experience building and scaling web applications and microservices. Proven track record of optimizing database queries, leading agile development teams, and reducing API response latency by 45%.

WORK EXPERIENCE
Senior Software Engineer | TechCorp Inc. | San Francisco, CA | 2021 – Present
• Architected and deployed microservices using Node.js, TypeScript, PostgreSQL, and Docker, serving over 150,000 active daily users with 99.99% uptime.
• Reduced frontend bundle load times by 42% by implementing Next.js Server Components and dynamic code splitting.
• Mentored a team of 5 engineers, conducting weekly code reviews and establishing automated CI/CD deployment pipelines using GitHub Actions.

Software Engineer | Innovate Systems | Austin, TX | 2018 – 2021
• Developed RESTful and GraphQL API services in Python/Django, handling 10M+ daily telemetry requests.
• Optimized PostgreSQL query performance and indexed high-volume database tables, dropping p95 latency from 450ms to 85ms.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3
Frameworks: React, Next.js, Node.js, Express, TailwindCSS, Django
Databases & Cloud: PostgreSQL, Redis, MongoDB, AWS (S3, EC2), Docker, Git, CI/CD`;

    const sampleJob = `Senior Full Stack Developer
Company: Acme Cloud Solutions
Location: Remote / San Francisco, CA

About the Role:
We are seeking a Senior Full Stack Engineer to lead the architecture and development of our next-generation developer platform. You will work across TypeScript, React, Next.js, Node.js, and PostgreSQL to deliver high-performance cloud applications.

Key Responsibilities:
- Design and maintain scalable microservices in Node.js and TypeScript.
- Build clean, accessible user interfaces using React and Next.js.
- Optimize database queries and caching layers in PostgreSQL and Redis.

Qualifications:
- 4+ years of production experience with React, TypeScript, and Node.js.
- Strong knowledge of relational databases (PostgreSQL/MySQL) and caching strategies.`;

    setResumeText(sampleResume);
    setJobDescription(sampleJob);
    setTargetRole("Senior Full Stack Developer");
    setUploadedFile(null);
    setFileName(null);
  };

  const handleLoadArchetypeSample = (sampleResume: string, sampleJob: string, role: string) => {
    setResumeText(sampleResume);
    setJobDescription(sampleJob);
    setTargetRole(role);
    setUploadedFile(null);
    setFileName(null);
    const scannerElem = document.getElementById("scanner-form");
    if (scannerElem) {
      scannerElem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleStartDemo = (archetypeKey: "swe" | "pm" | "ml" = "swe") => {
    const archetype = DEMO_ARCHETYPES[archetypeKey];
    setDemoArchetype(archetypeKey);
    setIsDemoMode(true);
    setResult(archetype.result);
    setExtractedText(archetype.resumeText);
    setResumeText(archetype.resumeText);
    setJobDescription(archetype.jobDescription);
    setTargetRole(archetype.role);
    setError(null);
    setRequiresUpgrade(false);
  };

  const handleSelectDemoArchetype = (archetypeKey: "swe" | "pm" | "ml") => {
    handleStartDemo(archetypeKey);
  };

  const handleExitDemo = () => {
    setIsDemoMode(false);
    setResult(null);
    setExtractedText("");
    setResumeText("");
    setJobDescription("");
    setTargetRole("");
  };

  const handleScrollToUpload = () => {
    handleExitDemo();
    setTimeout(() => {
      const scannerElem = document.getElementById("scanner-form");
      if (scannerElem) {
        scannerElem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

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

  // ── Universal ⌘+V Clipboard Paste Anywhere ────────────────
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }

      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (
          file.type.includes("pdf") ||
          file.name.endsWith(".pdf") ||
          file.name.endsWith(".docx")
        ) {
          e.preventDefault();
          onDrop([file]);
          return;
        }
      }

      const text = e.clipboardData?.getData("text");
      if (text && text.trim().length > 80) {
        e.preventDefault();
        setResumeText(text.trim());
        setFileName(null);
        setUploadedFile(null);
        const el = document.getElementById("scanner-form");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onDrop]);

  // ── Scrape job URL ──────────────────────────────────────────
  async function handleScrapeUrl() {
    if (!jobUrl.trim()) return;
    setIsScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch("/api/scrape-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to scrape");
      setJobDescription(data.jobDescription);
      if (data.targetRole) {
        setTargetRole(data.targetRole);
      }
      setScrapeMode("paste"); // switch back to text view to show result
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scraping failed";
      setScrapeError(msg);
    } finally {
      setIsScraping(false);
    }
  }

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
    setResumeStyleTokens(DEFAULT_STYLE_TOKENS);

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

      if (data.resumeStyleTokens) {
        setResumeStyleTokens(data.resumeStyleTokens);
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
          <div
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Resume<span style={{ color: "var(--accent)" }}>Lens</span>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-ink hover:text-accent transition-colors focus:outline-none p-1"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-paper-card text-ink-muted hover:text-ink hover:border-accent/40 text-xs font-medium cursor-pointer transition-all duration-150"
            title="Open Command Palette (Cmd+K)"
          >
            <Search size={13} className="text-orange-500" />
            <span>Search commands</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-paper-warm border border-border text-ink-faint">
              ⌘K
            </kbd>
          </button>
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

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>⚡ NEXT-GEN ATS INTELLIGENCE 2.0</span>
          </div>
          <h1
            className="font-display tracking-tight leading-tight mb-4 text-ink"
            style={{
              fontSize: "clamp(38px, 5.8vw, 64px)",
              letterSpacing: "-1.5px",
            }}
          >
            Your resume,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-amber-500 to-indigo-500 italic inline-block pr-3">
              honestly reviewed
            </span>
          </h1>
          <p className="text-ink-muted text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-6">
            Get instant, deep analysis on your resume. Identify ATS keyword gaps, receive quantified
            XYZ rewrite suggestions, and match yourself perfectly to target jobs.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-8">
            <button
              onClick={() => handleStartDemo("swe")}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
            >
              <Sparkles size={16} className="text-amber-300" />
              <span>⚡ Try Live Interactive Demo</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById("scanner-form");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="px-6 py-3 rounded-xl font-bold text-sm text-ink bg-paper-card border border-border hover:border-accent/40 flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-xs"
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
            >
              <Upload size={15} className="text-accent" />
              <span>Upload My Resume</span>
            </button>
          </div>

          {/* Social Proof & Trust Ticker */}
          <SocialProofTicker />
        </div>

        {/* Unsaved Draft Recovery Banner */}
        {hasSavedDraft && savedDraft && (
          <div className="glass-card max-w-xl mx-auto mb-6 p-3 px-4 rounded-xl flex items-center justify-between text-xs border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <span>⚡ Unsaved draft recovered from previous session</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold cursor-pointer hover:bg-amber-600 transition"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={clearSavedDraft}
                className="px-2 py-1 rounded-lg text-amber-700 dark:text-amber-300 font-semibold cursor-pointer hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

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
                  {profile.plan === "free"
                    ? "Free Tier"
                    : profile.plan === "monthly"
                      ? "Pro Monthly"
                      : "Lifetime Pro"}
                </strong>
              </span>
            </div>
            <div>
              {profile.plan === "free" ? (
                <span className="text-ink-muted">
                  Quota:{" "}
                  <strong className="text-ink">
                    {Math.max(0, profile.analyses_limit - profile.analyses_used)} /{" "}
                    {profile.analyses_limit}
                  </strong>{" "}
                  remaining
                </span>
              ) : (
                <strong className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <span>Unlimited Reviews</span>
                  <Sparkles size={14} className="text-amber-500" />
                </strong>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="my-12">
            <ParsingProgressVisualizer currentStep={loadingStep} />
          </div>
        ) : (
          <>
            {/* Input Grid */}
            <div
              id="scanner-form"
              className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 scroll-mt-24"
            >
              {/* Left — Resume */}
              <Panel label="Your Resume">
                {/* Drop zone */}
                <div
                  {...getRootProps()}
                  className="bento-card p-6 cursor-pointer text-center flex flex-col items-center justify-center gap-3.5 transition-all duration-300 group hover:border-accent/50"
                  style={{
                    borderColor: isDragActive ? "var(--accent)" : "var(--border-strong)",
                    background: isDragActive ? "var(--accent-bg)" : "var(--paper-warm)",
                  }}
                >
                  <input {...getInputProps()} />
                  <div className="flex items-center justify-center">
                    {fileName ? (
                      <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20">
                        <FileText size={28} className="text-accent" />
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-paper-card border border-border group-hover:border-accent/40 group-hover:scale-105 transition">
                        <Upload
                          size={28}
                          className="text-ink-muted group-hover:text-accent transition-colors"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-ink font-semibold font-mono leading-relaxed max-w-xs mx-auto">
                      {fileName
                        ? `${fileName}`
                        : isDragActive
                          ? "Release to upload resume..."
                          : "Drop PDF, DOCX, or TXT here, or click to browse"}
                    </p>
                    <span className="text-[10px] text-ink-faint font-mono">
                      (or press{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-paper-card border border-border text-[9px] font-bold text-ink">
                        ⌘+V
                      </kbd>{" "}
                      anywhere to paste)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadSample();
                    }}
                    className="px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <span>⚡ Try with Sample Resume</span>
                  </button>
                </div>

                <div className="relative my-5 text-center">
                  <span
                    className="absolute inset-y-1/2 left-0 right-0 h-px"
                    style={{ background: "var(--border)" }}
                  />
                  <span
                    className="relative px-3 font-mono text-[10px] tracking-widest text-ink-faint uppercase"
                    style={{ background: "var(--paper-card)" }}
                  >
                    or paste resume text
                  </span>
                </div>

                <textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    if (e.target.value) {
                      setUploadedFile(null);
                      setFileName(null);
                    }
                  }}
                  placeholder="Paste the raw text of your resume here..."
                  className="premium-input w-full min-h-[220px] font-mono text-xs leading-relaxed"
                />
                <div className="flex justify-between items-center mt-1.5 px-0.5">
                  <span className="text-[10px] font-mono text-ink-faint">
                    {resumeText.length > 0
                      ? `${resumeText.length.toLocaleString()} characters`
                      : ""}
                  </span>
                  {resumeText.length > 500 && (
                    <span
                      className={`text-[10px] font-mono font-semibold ${resumeText.length >= 4000 ? "text-emerald-500" : resumeText.length >= 1500 ? "text-amber-500" : "text-ink-faint"}`}
                    >
                      {resumeText.length >= 4000
                        ? "Great length"
                        : resumeText.length >= 1500
                          ? "Good — add more for best results"
                          : "Keep going…"}
                    </span>
                  )}
                </div>
              </Panel>

              {/* Right — Job context */}
              <Panel label="Job Context (recommended)">
                {/* URL / Paste toggle */}
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  <button
                    type="button"
                    onClick={() => setScrapeMode("paste")}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 8,
                      border: `1.5px solid ${scrapeMode === "paste" ? "var(--accent)" : "var(--border)"}`,
                      background: scrapeMode === "paste" ? "var(--accent-bg)" : "var(--paper-card)",
                      color: scrapeMode === "paste" ? "var(--accent)" : "var(--ink-muted)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    📋 Paste Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setScrapeMode("url")}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 8,
                      border: `1.5px solid ${scrapeMode === "url" ? "var(--accent)" : "var(--border)"}`,
                      background: scrapeMode === "url" ? "var(--accent-bg)" : "var(--paper-card)",
                      color: scrapeMode === "url" ? "var(--accent)" : "var(--ink-muted)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    🔗 Job URL
                  </button>
                </div>

                {scrapeMode === "url" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.5 }}>
                      Paste a LinkedIn, Indeed, Greenhouse, Lever, or Workday job URL and we'll
                      extract the description automatically.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="url"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleScrapeUrl()}
                        placeholder="https://linkedin.com/jobs/view/..."
                        className="premium-input"
                        style={{ flex: 1, fontSize: 12 }}
                      />
                      <button
                        type="button"
                        onClick={handleScrapeUrl}
                        disabled={isScraping || !jobUrl.trim()}
                        style={{
                          background: isScraping ? "#9ca3af" : "var(--accent)",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "0 16px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: isScraping ? "wait" : "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {isScraping ? "Fetching..." : "Fetch"}
                      </button>
                    </div>

                    {jobUrl.trim() && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/5 border border-accent/15 text-[11px] font-mono animate-fadeIn">
                        <ShieldCheck size={13} className="text-accent shrink-0" />
                        <span className="text-ink-muted">Detected Parser:</span>
                        <strong className="text-ink font-bold">
                          {detectAtsVendorFromUrl(jobUrl).vendorName}
                        </strong>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-paper text-ink-faint border border-border">
                          {detectAtsVendorFromUrl(jobUrl).spec.category}
                        </span>
                      </div>
                    )}

                    {scrapeError && (
                      <div style={{ fontSize: 11, color: "#ef4444", lineHeight: 1.4 }}>
                        ⚠️ {scrapeError}
                      </div>
                    )}
                    {jobDescription && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        ✅ Job description fetched ({jobDescription.length.toLocaleString()} chars)
                        —{" "}
                        <button
                          type="button"
                          onClick={() => setScrapeMode("paste")}
                          style={{
                            color: "var(--accent)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                            padding: 0,
                          }}
                        >
                          View text
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here. Enabling this unlocks personalized matching, ATS gap analysis, and tailored rewrites..."
                    className="premium-input w-full min-h-[180px] font-mono text-xs leading-relaxed mb-4"
                  />
                )}
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder='Target role, e.g. "Senior Frontend Developer"'
                  className="premium-input w-full"
                  style={{ marginTop: scrapeMode === "url" ? 8 : 0 }}
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
                <span>Analyze Resume</span>
                <Play size={14} fill="currentColor" />
              </button>

              {error && (
                <p className="text-red-500 font-medium text-sm mt-4 text-center max-w-md bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                  {error}
                </p>
              )}
            </div>
          </>
        )}

        {/* Results */}
        {result && (
          <>
            {isDemoMode && (
              <DemoConversionBanner
                activeArchetype={demoArchetype}
                onSelectArchetype={handleSelectDemoArchetype}
                onExitDemo={handleExitDemo}
                onUploadOwn={handleScrollToUpload}
              />
            )}
            {confettiKey > 0 && (
              <ConfettiCannon score={result.score} trigger={confettiKey % 2 === 1} />
            )}
            <ResultsPanel
              result={result}
              hasJD={hasJD}
              resumeText={extractedText}
              jobDescription={jobDescription}
              targetRole={targetRole}
              resumeStyleTokens={resumeStyleTokens}
            />
          </>
        )}

        {/* Upgrade preview */}
        {requiresUpgrade && preview && !showUpgradeModal && (
          <div className="glass-card max-w-xl mx-auto p-8 rounded-2xl text-center shadow-premium bg-gradient-to-b from-paper-card to-paper-warm/20 mt-8">
            <div className="font-display text-5xl text-accent mb-2">{preview.score}</div>
            <p className="text-ink-muted mb-6 text-sm leading-relaxed max-w-sm mx-auto">
              {preview.summary}
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-gradient px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
            >
              <span>Unlock Full Report</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </main>

      {/* Interactive Sandbox & Marketing — only when no result is active */}
      {!result && !requiresUpgrade && (
        <div className="max-w-5xl mx-auto px-6">
          <InteractiveResumeSandbox onSelectSample={handleLoadArchetypeSample} />
          <HomepageMarketing />
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal preview={preview} onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onStartDemo={(arch) => handleStartDemo(arch)}
        onToggleTheme={() => {
          const themeBtn = document.querySelector(
            '[aria-label="Toggle theme"]'
          ) as HTMLButtonElement;
          if (themeBtn) themeBtn.click();
        }}
      />
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <SpotlightCard
      className="specular-border rounded-2xl overflow-hidden flex flex-col h-full bg-paper-card"
      specularBorder={true}
    >
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
    </SpotlightCard>
  );
}
