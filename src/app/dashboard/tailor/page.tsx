"use client";
import { logger } from "@/lib/logger";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { parseResume } from "@/lib/parseResume";
import { useToast } from "@/components/ToastProvider";
import { downloadResumePdf } from "@/lib/pdf/downloadPdf";
import * as Diff from "diff";
import {
  Settings,
  Sparkles,
  Wrench,
  Loader2,
  ScanSearch,
  Target,
  BookOpen,
  FileText,
  X,
  ArrowLeft,
  ArrowRight,
  Download,
  Check,
  Layers,
} from "lucide-react";
import MultiJobMatrixModal from "@/components/MultiJobMatrixModal";

interface ResumeItem {
  id: string;
  name: string;
  target_role: string | null;
  target_company: string | null;
  resume_text: string;
}

interface KeywordItem {
  text: string;
  matched: boolean;
}

export default function TailorSandboxPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [mounted, setMounted] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [originAnalysisId, setOriginAnalysisId] = useState<string | null>(null);

  // Setup Form States
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Sandbox Active States
  const [activeSandbox, setActiveSandbox] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStep, setInitStep] = useState(0);

  const [originalText, setOriginalText] = useState("");
  const [tailoredText, setTailoredText] = useState("");
  const [recommendedTemplate, setRecommendedTemplate] = useState("minimal");

  // Live Score and Keyword States
  const [score, setScore] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);

  // Diff and Editor States
  const [showDiff, setShowDiff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const LOADING_STEPS = [
    "Analyzing baseline resume syntax...",
    "Matching credentials against job requirements...",
    "Extracting key target keywords...",
    "Optimizing summary and experience bullets...",
    "Assembling split editor sandbox...",
  ];

  useEffect(() => {
    setMounted(true);
    fetchResumes();

    const params = new URLSearchParams(window.location.search);
    const analysisId = params.get("analysisId");
    if (analysisId) {
      setOriginAnalysisId(analysisId);
    }
  }, []);

  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const res = await fetch("/api/resumes");
      const data = await res.json();
      if (res.ok && data.success) {
        setResumes(data.data || []);
      }
    } catch (err) {
      logger.error("Failed to load resumes", err);
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    const selected = resumes.find((r) => r.id === id);
    if (selected) {
      if (selected.target_role) setRoleTitle(selected.target_role);
      if (selected.target_company) setCompanyName(selected.target_company);
    }
  };

  // Launch AI Tailor Sandbox
  const handleLaunchSandbox = async () => {
    const selected = resumes.find((r) => r.id === selectedResumeId);
    if (!selected || !jobDescription.trim()) return;

    setIsInitializing(true);
    setInitStep(0);

    const stepInterval = setInterval(() => {
      setInitStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2000);

    try {
      // 1. Fetch tailored resume draft
      const tailorRes = await fetch("/api/job-match/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: selected.resume_text,
          jobDescription,
          targetRole: roleTitle || undefined,
        }),
      });

      const tailorData = await tailorRes.json();
      if (!tailorRes.ok || !tailorData.success) {
        throw new Error(tailorData.error || "Failed to tailor resume.");
      }

      setOriginalText(selected.resume_text);
      setTailoredText(tailorData.tailoredText);
      setRecommendedTemplate(tailorData.recommendedTemplate || "minimal");
      setSaveName(`${selected.name} (Tailored for ${companyName || "Target Role"})`);

      // 2. Fetch baseline ATS match score & keywords list
      const matchRes = await fetch("/api/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: tailorData.tailoredText,
          jobDescription,
          jobTitle: roleTitle || undefined,
          companyName: companyName || undefined,
        }),
      });

      const matchData = await matchRes.json();
      if (matchRes.ok && matchData.success) {
        setScore(matchData.data.overallScore);
        const extractedKeywords = [
          ...matchData.data.matchedKeywords.map((kw: string) => ({ text: kw, matched: true })),
          ...matchData.data.missingKeywords.map((kw: string) => ({ text: kw, matched: false })),
        ];
        setKeywords(extractedKeywords);
      }

      setActiveSandbox(true);
      toastSuccess("Playground initialized. Start editing!", "Sandbox Ready");
    } catch (err: unknown) {
      logger.error(err);
      toastError((err as Error).message || "Failed to launch sandbox.");
    } finally {
      clearInterval(stepInterval);
      setIsInitializing(false);
    }
  };

  // Live Score Recalculation
  const handleRecalculateScore = async () => {
    if (!tailoredText.trim()) return;

    setIsScanning(true);
    try {
      const res = await fetch("/api/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: tailoredText,
          jobDescription,
          jobTitle: roleTitle || undefined,
          companyName: companyName || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setScore(data.data.overallScore);
        const extractedKeywords = [
          ...data.data.matchedKeywords.map((kw: string) => ({ text: kw, matched: true })),
          ...data.data.missingKeywords.map((kw: string) => ({ text: kw, matched: false })),
        ];
        setKeywords(extractedKeywords);
        toastSuccess("ATS Match score and keywords updated!", "Scan Complete");
      } else {
        toastError(data.error || "Failed to update match score.");
      }
    } catch (err) {
      toastError("Failed to connect to scanner endpoint.");
    } finally {
      setIsScanning(false);
    }
  };

  // Live Keyword Checklist evaluation
  const liveChecklist = useMemo(() => {
    return keywords.map((kw) => {
      const isPresent = tailoredText.toLowerCase().includes(kw.text.toLowerCase());
      return { ...kw, matched: kw.matched || isPresent };
    });
  }, [keywords, tailoredText]);

  const matchedCount = liveChecklist.filter((k) => k.matched).length;

  // Visual Diff Tokens Myers calculation
  const diffTokens = useMemo(() => {
    if (!showDiff) return [];
    return Diff.diffWordsWithSpace(originalText, tailoredText);
  }, [showDiff, originalText, tailoredText]);

  // Save Sandbox Resume to DB
  const handleSaveResume = async () => {
    if (!saveName.trim() || !tailoredText.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName,
          resumeText: tailoredText,
          targetRole: roleTitle || null,
          targetCompany: companyName || null,
          jobDescription: jobDescription || null,
          lastScore: score,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save tailored resume.");
      }

      toastSuccess("Optimized resume saved to your library!", "Saved");
      setShowSaveModal(false);
      fetchResumes(); // Reload resumes dropdown
    } catch (err: unknown) {
      toastError((err as Error).message || "Failed to save version.");
    } finally {
      setIsSaving(false);
    }
  };

  // Export PDF Template Trigger
  const handleExportPdf = async (templateId: string) => {
    if (!tailoredText.trim()) return;

    try {
      const parsed = parseResume(tailoredText);
      await downloadResumePdf(templateId, parsed, roleTitle || undefined);
      toastSuccess("PDF generated successfully.", "Download Complete");
      setShowExportModal(false);
    } catch (err: unknown) {
      logger.error(err);
      toastError("Failed to compile vector PDF template.");
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      {/* Setup view: standard scroll page */}
      {!activeSandbox && (
        <div className="workspace-canvas">
          <div className="max-w-4xl mx-auto fade-up space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl font-bold tracking-tight text-ink mb-1.5 flex items-center gap-2.5">
                  AI Tailoring Sandbox
                </h1>
                <p className="text-ink-muted text-sm leading-relaxed">
                  Optimize and match your baseline resume to target roles. Write manual edits inside
                  a side-by-side sandbox, track matching keywords, and evaluate ATS fit in
                  real-time.
                </p>
              </div>

              <button
                onClick={() => {
                  const sel = resumes.find((r) => r.id === selectedResumeId);
                  setOriginalText(sel ? sel.resume_text : "");
                  setShowMatrixModal(true);
                }}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                  border: "none",
                }}
              >
                <Layers size={14} />
                <span>Multi-Job Matrix v2 🚀</span>
              </button>
            </div>

            <div className="glass-card bg-paper-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

              <h3 className="font-display text-lg font-bold text-ink border-b border-border pb-3 flex items-center gap-2">
                Setup Sandbox Configuration
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider font-mono">
                      Baseline Resume
                    </label>
                    <select
                      value={selectedResumeId}
                      onChange={handleResumeChange}
                      disabled={loadingResumes || isInitializing}
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition disabled:opacity-50"
                    >
                      <option value="">-- Select resume from library --</option>
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.target_role ? `(${r.target_role})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider font-mono">
                        Target Role Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Frontend Engineer"
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        disabled={isInitializing}
                        className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition disabled:opacity-50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider font-mono">
                        Target Company
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Vercel"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={isInitializing}
                        className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider font-mono">
                    Job Description (min 50 chars)
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Paste the full target job description or requirements list here to scan and optimize match score keywords..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    disabled={isInitializing}
                    className="w-full bg-paper border border-border rounded-xl p-4 text-xs font-mono leading-relaxed text-ink outline-none focus:border-accent transition disabled:opacity-50"
                  />
                  <div className="text-right text-[10px] font-mono text-ink-faint">
                    {jobDescription.length.toLocaleString()} characters
                  </div>
                </div>
              </div>

              <button
                onClick={handleLaunchSandbox}
                disabled={!selectedResumeId || jobDescription.trim().length < 50 || isInitializing}
                className="w-full btn-gradient py-3.5 rounded-xl text-sm font-semibold shadow hover:scale-[1.01] active:scale-[1] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-[1] transition flex items-center justify-center gap-2 cursor-pointer text-white"
              >
                {isInitializing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-flex">
                      <Loader2 size={15} />
                    </span>
                    <span>{LOADING_STEPS[initStep]}</span>
                  </span>
                ) : (
                  <>
                    <Sparkles size={14} /> Initialize Tailor Playground Sandbox
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active sandbox view: viewport-locked 3-pane workspace */}
      {activeSandbox && (
        <div className="workspace-shell fade-up">
          {/* === CENTER CANVAS: editors === */}
          <div className="workspace-canvas">
            {/* Sandbox top header bar */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="status-pill status-pill-accent text-[10px]">
                  <Wrench size={9} />
                  Sandbox Active
                </span>
                <div className="min-w-0">
                  <h1 className="font-display text-xl font-bold text-ink leading-tight truncate">
                    {roleTitle || "Target Role"} Sandbox
                  </h1>
                  <p className="text-[11px] text-ink-muted truncate">
                    Targeting {companyName || "Target Company"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm("Exit sandbox? Unsaved edits will be lost.")) {
                    if (originAnalysisId) {
                      router.push(`/dashboard/${originAnalysisId}`);
                    } else {
                      setActiveSandbox(false);
                      setOriginalText("");
                      setTailoredText("");
                      setKeywords([]);
                      setScore(null);
                    }
                  }
                }}
                className="flex-shrink-0 px-3 py-2 border border-border rounded-xl text-xs font-semibold text-ink-muted hover:text-ink bg-paper hover:bg-paper-warm transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={12} /> Exit
              </button>
            </div>

            {/* Split Screen Editors */}
            <div className="grid grid-cols-2 gap-4 h-[calc(100%-80px)]">
              {/* Left Column: Baseline Reference (Read-only) */}
              <div className="glass-card bg-paper-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-lg">
                <div className="px-4 py-2.5 border-b border-border bg-paper-warm/20 flex justify-between items-center flex-shrink-0">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-rose-400 uppercase flex items-center gap-1.5">
                    <BookOpen size={9} /> Baseline Resume (Read-only)
                  </span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-muted select-none">
                    {originalText}
                  </pre>
                </div>
              </div>

              {/* Right Column: Tailored Editor / Visual Diff */}
              <div className="glass-card bg-paper-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-lg">
                <div className="px-4 py-2.5 border-b border-border bg-paper-warm/20 flex justify-between items-center flex-shrink-0">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
                    <FileText size={9} /> Tailored Draft (Editable)
                  </span>
                  <div className="flex items-center gap-2">
                    <label
                      className="text-[10px] font-semibold text-ink-muted cursor-pointer font-mono"
                      htmlFor="diff-toggle"
                    >
                      Diff
                    </label>
                    <input
                      id="diff-toggle"
                      type="checkbox"
                      checked={showDiff}
                      onChange={(e) => setShowDiff(e.target.checked)}
                      className="cursor-pointer accent-accent"
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 relative">
                  {!showDiff ? (
                    <textarea
                      value={tailoredText}
                      onChange={(e) => setTailoredText(e.target.value)}
                      placeholder="AI tailored draft loaded here. Add manual edits, insert metrics, or restructure bullets..."
                      className="w-full h-full p-4 bg-paper font-mono text-[11px] leading-relaxed text-ink border-none outline-none resize-none focus:bg-paper-warm/30 transition-colors"
                    />
                  ) : (
                    <div className="w-full h-full p-4 overflow-y-auto bg-paper font-mono text-[11px] leading-relaxed">
                      {diffTokens.length === 0 ? (
                        <span className="text-ink-faint italic">No differences calculated.</span>
                      ) : (
                        diffTokens.map((part, index) => {
                          if (part.added) {
                            return (
                              <span
                                key={index}
                                className="bg-emerald-500/10 text-emerald-400 font-semibold px-0.5 rounded"
                              >
                                {part.value}
                              </span>
                            );
                          }
                          if (part.removed) {
                            return (
                              <span
                                key={index}
                                className="bg-rose-500/10 text-rose-400 line-through px-0.5 rounded"
                              >
                                {part.value}
                              </span>
                            );
                          }
                          return <span key={index}>{part.value}</span>;
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* === RIGHT INSPECTOR PANEL === */}
          <div className="workspace-inspector">
            {/* ATS Score Block */}
            <div>
              <p className="section-label mb-3">ATS Score</p>
              <div className="inspector-score-block">
                {score !== null ? (
                  <>
                    <div
                      className={`text-4xl font-black font-mono mb-1 ${
                        score >= 80
                          ? "text-emerald-400"
                          : score >= 60
                            ? "text-amber-400"
                            : "text-rose-400"
                      }`}
                    >
                      {score}%
                    </div>
                    <div className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">
                      ATS Compatibility
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-paper-warm overflow-hidden">
                      <div
                        className={`h-full rounded-full score-bar ${
                          score >= 80
                            ? "bg-emerald-400"
                            : score >= 60
                              ? "bg-amber-400"
                              : "bg-rose-400"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="mt-2 text-[10px] text-ink-faint">
                      {score >= 80
                        ? "Strong match — recruiter ready"
                        : score >= 60
                          ? "Good — add more keywords"
                          : "Needs improvement"}
                    </div>
                  </>
                ) : (
                  <div className="text-ink-faint text-xs py-2">Run scan to see score</div>
                )}
              </div>
            </div>

            {/* Rescan Button */}
            <button
              onClick={handleRecalculateScore}
              disabled={isScanning}
              className="w-full bg-paper border border-border text-ink hover:text-accent hover:border-accent-border py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isScanning ? (
                <>
                  <span className="animate-spin inline-flex">
                    <Loader2 size={12} />
                  </span>{" "}
                  Scanning...
                </>
              ) : (
                <>
                  <ScanSearch size={12} /> Re-scan Match Score
                </>
              )}
            </button>

            {/* Keywords Checklist */}
            {liveChecklist.length > 0 && (
              <div>
                <p className="section-label mb-3">
                  Keywords
                  <span className="ml-auto font-mono text-[10px] text-emerald-400 not-italic">
                    {matchedCount}/{liveChecklist.length}
                  </span>
                </p>
                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                  {liveChecklist.map((kw, i) => (
                    <div
                      key={i}
                      className={`kw-chip ${kw.matched ? "kw-chip-matched" : "kw-chip-missing"}`}
                    >
                      <span className="text-[9px]">{kw.matched ? "✓" : "–"}</span>
                      <span className={kw.matched ? "line-through opacity-60" : ""}>{kw.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress ring */}
            {liveChecklist.length > 0 && (
              <div className="inspector-score-block">
                <p className="text-[10px] font-mono text-ink-faint uppercase tracking-wider mb-2">
                  Keyword Coverage
                </p>
                <div className="h-1.5 rounded-full bg-paper-warm overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 score-bar"
                    style={{ width: `${Math.round((matchedCount / liveChecklist.length) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] font-bold text-ink mt-1.5">
                  {Math.round((matchedCount / liveChecklist.length) * 100)}% covered
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
              <button
                onClick={() => setShowSaveModal(true)}
                className="w-full btn-gradient py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer shadow hover:scale-[1.01] active:scale-[1] transition flex items-center justify-center gap-1.5"
              >
                Save as New Version
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="w-full bg-paper border border-border text-ink-muted hover:text-accent hover:border-accent-border py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={12} /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Save Version Confirmation */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-paper-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-ink">Save Sandbox Version</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Save the current tailored draft as a new resume in your document library. This will
              not overwrite your baseline reference copy.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted">
                Document Version Name
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. Senior Frontend Resume (Tailored)"
                className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-ink-muted hover:text-ink hover:bg-paper-warm transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResume}
                disabled={isSaving || !saveName.trim()}
                className="bg-accent hover:bg-accent/90 text-white font-semibold px-5 py-2 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer shadow flex items-center gap-1.5"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <span>Save Resume</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: PDF Template Selector Download */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-paper-card border border-border rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <FileText size={14} /> Export Vector PDF Template
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-ink-muted hover:text-ink text-sm p-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Compile your tailored resume layout draft into a high-fidelity, ATS-safe vector PDF.
              Select one of our premium design layouts to download:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: "minimal",
                  name: "Minimalist CV",
                  desc: "Spacious layout with clean Helvetica. Perfect for default universal styling.",
                },
                {
                  id: "professional",
                  name: "Professional Corporate",
                  desc: "Classic Lora serif formatting with elegant spacing. Great for conservative fields.",
                },
                {
                  id: "modern",
                  name: "Modern Sidebar",
                  desc: "Dual column system placing skills, links, and contact elements on a left-side panel.",
                },
                {
                  id: "creative",
                  name: "Creative Designer",
                  desc: "Premium Indigo accent styling with warm ivory grids. Best for startup roles.",
                },
                {
                  id: "executive",
                  name: "Executive Suite",
                  desc: "Formal Times serif formatting with deep oxblood highlights. Ideal for leadership titles.",
                },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleExportPdf(tpl.id)}
                  className="p-4 rounded-2xl border border-border hover:border-accent text-left bg-paper hover:bg-accent-bg transition flex flex-col justify-between items-stretch gap-2 group cursor-pointer"
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-ink group-hover:text-accent">
                        {tpl.name}
                      </span>
                      {tpl.id === recommendedTemplate && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-ink-muted leading-normal mt-1">{tpl.desc}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-accent text-right mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Download PDF <ArrowRight size={10} />
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-ink-muted hover:text-ink hover:bg-paper-warm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Job Matrix Modal */}
      {showMatrixModal && (
        <MultiJobMatrixModal
          resumeText={originalText || "Sample Resume Content"}
          onClose={() => setShowMatrixModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
