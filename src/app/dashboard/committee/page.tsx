"use client";
import { logger } from "@/lib/logger";

import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { type CommitteeDebriefResult } from "@/types";
import SpotlightCard from "@/components/SpotlightCard";
import { Sparkles, Scale, Mic, ChevronsRight, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";

interface ResumeItem {
  id: string;
  name: string;
  target_role: string | null;
  target_company: string | null;
  resume_text: string;
}

export default function CommitteeSimulationPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [mounted, setMounted] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);

  // Setup Form States
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Loading / Convening States
  const [isConvening, setIsConvening] = useState(false);
  const [conveningStep, setConveningStep] = useState(0);

  // Active Results States
  const [activeSimulation, setActiveSimulation] = useState(false);
  const [debriefData, setDebriefData] = useState<CommitteeDebriefResult | null>(null);
  const [, setFileName] = useState<string | null>(null);

  // Playback Control States
  const [visibleMessageCount, setVisibleMessageCount] = useState(1);
  const [isPlayingDebrief, setIsPlayingDebrief] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const CONVENING_STEPS = [
    "Sarah (HR Recruiter) entering the debrief room...",
    "Alex (Engineering Manager) auditing tech stack depth...",
    "Emma (Product Manager) reviewing impact metrics...",
    "Convene panel discussion. Reviewing bullet points...",
    "Deliberating candidate recommendation and verdict...",
    "Compiling consensus scorecard...",
  ];

  useEffect(() => {
    setMounted(true);
    fetchResumes();

    // Check if analysisId is in query params
    const params = new URLSearchParams(window.location.search);
    const analysisId = params.get("analysisId");
    if (analysisId) {
      loadPastSimulation(analysisId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount; loadPastSimulation updates state and must not be re-added
  }, []);

  // Playback Timer Loop
  useEffect(() => {
    if (!activeSimulation || !debriefData || !isPlayingDebrief) return;

    const totalMessages = debriefData.debriefTranscript.length;
    if (visibleMessageCount >= totalMessages) {
      setIsPlayingDebrief(false);
      return;
    }

    const timer = setTimeout(() => {
      setVisibleMessageCount((prev) => {
        const next = prev + 1;
        // Scroll transcript view
        setTimeout(() => {
          transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 50);
        return next;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [activeSimulation, debriefData, isPlayingDebrief, visibleMessageCount]);

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

  const loadPastSimulation = async (id: string) => {
    setIsConvening(true);
    setDebriefData(null);
    setConveningStep(0);

    const interval = setInterval(() => {
      setConveningStep((s) => Math.min(s + 1, CONVENING_STEPS.length - 1));
    }, 1800);

    try {
      const res = await fetch(`/api/analyses/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load past debrief report.");
      }

      const parsedJson =
        typeof data.data.result_json === "string"
          ? JSON.parse(data.data.result_json)
          : data.data.result_json;

      // If it is not a committee debrief, automatically convene a new committee debrief using its details!
      if (!parsedJson || !parsedJson.isCommittee) {
        clearInterval(interval);
        setIsConvening(true);
        setConveningStep(0);

        setRoleTitle(data.data.target_role || "");
        setCompanyName(data.data.target_company || "");
        setJobDescription(data.data.job_description || "");

        const stepInterval = setInterval(() => {
          setConveningStep((s) => Math.min(s + 1, CONVENING_STEPS.length - 1));
        }, 2000);

        try {
          const committeeRes = await fetch("/api/analyze/committee", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resumeText: data.data.resume_text,
              jobDescription: data.data.job_description || "Universal professional standards review",
              targetRole: data.data.target_role || undefined,
              companyName: data.data.target_company || undefined,
            }),
          });

          const committeeData = await committeeRes.json();
          if (!committeeRes.ok || !committeeData.success) {
            throw new Error(committeeData.error || "Failed to convene hiring panel.");
          }

          setDebriefData(committeeData.data);
          setFileName("Active Analysis Link");
          setActiveSimulation(true);
          setVisibleMessageCount(1);
          setIsPlayingDebrief(true);
          toastSuccess("Hiring committee debrief complete!", "Debrief Finished");
        } catch (err: unknown) {
          logger.error(err);
          toastError((err as Error).message || "Failed to compile panel debrief.");
        } finally {
          clearInterval(stepInterval);
          setIsConvening(false);
        }
        return;
      }

      setDebriefData(parsedJson);
      setRoleTitle(data.data.target_role || "");
      setJobDescription(data.data.job_description || "");
      setFileName("Past Saved Report");
      setActiveSimulation(true);
      setVisibleMessageCount(1);
      setIsPlayingDebrief(true);
    } catch (err: unknown) {
      logger.error(err);
      toastError((err as Error).message || "Failed to load past committee simulation.");
      // Clear URL params
      window.history.replaceState({}, "", "/dashboard/committee");
    } finally {
      clearInterval(interval);
      setIsConvening(false);
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

  const handleConveneCommittee = async () => {
    const selected = resumes.find((r) => r.id === selectedResumeId);
    if (!selected || !jobDescription.trim()) return;

    setIsConvening(true);
    setConveningStep(0);

    const stepInterval = setInterval(() => {
      setConveningStep((s) => Math.min(s + 1, CONVENING_STEPS.length - 1));
    }, 2000);

    try {
      const res = await fetch("/api/analyze/committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: selected.resume_text,
          jobDescription,
          targetRole: roleTitle || undefined,
          companyName: companyName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to convene hiring panel.");
      }

      setDebriefData(data.data);
      setFileName(selected.name);
      setActiveSimulation(true);
      setVisibleMessageCount(1);
      setIsPlayingDebrief(true);
      toastSuccess("Hiring committee debrief complete!", "Debrief Finished");
    } catch (err: unknown) {
      logger.error(err);
      toastError((err as Error).message || "Failed to compile panel debrief.");
    } finally {
      clearInterval(stepInterval);
      setIsConvening(false);
    }
  };

  const handleReset = () => {
    setActiveSimulation(false);
    setDebriefData(null);
    setFileName(null);
    setVisibleMessageCount(1);
    setIsPlayingDebrief(false);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/dashboard/committee");
    }
  };

  // Get score averages and styles
  const consensusScore = debriefData
    ? Math.round((debriefData.hrScore + debriefData.techScore + debriefData.productScore) / 3)
    : 0;

  const getVerdictStyles = (verdict?: string) => {
    switch (verdict) {
      case "Strong Hire":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Hire":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "Leaning No Hire":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "No Hire":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-paper border-border text-ink-muted";
    }
  };

  const getAvatarBg = (speaker: string) => {
    switch (speaker) {
      case "HR Recruiter":
        return "bg-pink-600";
      case "Engineering Manager":
        return "bg-indigo-600";
      case "Product Manager":
        return "bg-teal-600";
      default:
        return "bg-slate-600";
    }
  };

  const getAvatarLetter = (speaker: string) => {
    switch (speaker) {
      case "HR Recruiter":
        return "S"; // Sarah
      case "Engineering Manager":
        return "A"; // Alex
      case "Product Manager":
        return "E"; // Emma
      default:
        return "?";
    }
  };

  const getSpeakerName = (speaker: string) => {
    switch (speaker) {
      case "HR Recruiter":
        return "Sarah (HR Recruiter)";
      case "Engineering Manager":
        return "Alex (Engineering Manager)";
      case "Product Manager":
        return "Emma (Product Manager)";
      default:
        return speaker;
    }
  };

  // Helper to determine if a specific speaker is actively speaking (most recent visible message)
  const currentActiveSpeaker = debriefData && visibleMessageCount > 0
    ? debriefData.debriefTranscript[visibleMessageCount - 1]?.speaker
    : null;

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CSS for Equalizer animation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes eqPulse {
            0% { height: 4px; }
            100% { height: 16px; }
          }
          .eq-bar-1 { animation: eqPulse 0.5s ease-in-out infinite alternate; }
          .eq-bar-2 { animation: eqPulse 0.7s ease-in-out infinite alternate 0.15s; }
          .eq-bar-3 { animation: eqPulse 0.6s ease-in-out infinite alternate 0.3s; }
        `}} />

        {/* Launcher Configuration (Setup View) */}
        {!activeSimulation && (
          <div className="max-w-3xl mx-auto fade-up space-y-6">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-ink mb-1.5 flex items-center gap-2.5">
                Recruiter Sandbox
              </h1>
              <p className="text-ink-muted text-sm leading-relaxed">
                Simulate a behind-the-scenes hiring committee debrief session. Convene a panel consisting of an HR Recruiter, an Engineering Manager, and a Product Manager to debate your credentials and vote.
              </p>
            </div>

            {isConvening ? (
              <div className="bg-paper-card border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-xl min-h-[350px]">
                <span className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <h3 className="font-display text-lg font-bold text-ink mt-2">
                  {CONVENING_STEPS[conveningStep]}
                </h3>
                <p className="text-xs text-ink-muted">
                  Gathering stakeholder ratings, analyzing tech stacks, and writing debate logs
                </p>
              </div>
            ) : (
              <SpotlightCard className="glass-card bg-paper-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

                <h3 className="font-display text-lg font-bold text-ink border-b border-border pb-3 flex items-center gap-2">
                  Configure Panel Debrief
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider font-mono">
                        Select Baseline Resume
                      </label>
                      <select
                        value={selectedResumeId}
                        onChange={handleResumeChange}
                        disabled={loadingResumes}
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
                          Target Role
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Senior Frontend"
                          value={roleTitle}
                          onChange={(e) => setRoleTitle(e.target.value)}
                          className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider font-mono">
                          Target Company
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. OpenAI"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition"
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
                      placeholder="Paste the full job description or core requirements lists here. The EM, PM, and Recruiter will use this description to evaluate and debate your resume bullets..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="w-full bg-paper border border-border rounded-xl p-4 text-xs font-mono leading-relaxed text-ink outline-none focus:border-accent transition"
                    />
                    <div className="text-right text-[10px] font-mono text-ink-faint">
                      {jobDescription.length.toLocaleString()} characters
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConveneCommittee}
                  disabled={!selectedResumeId || jobDescription.trim().length < 50}
                  className="w-full btn-gradient py-3.5 rounded-xl text-sm font-semibold shadow hover:scale-[1.01] active:scale-[1] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-[1] transition flex items-center justify-center gap-2 cursor-pointer text-white"
                >
                  <Sparkles size={14} /> Convene Hiring Committee Debrief
                </button>
              </SpotlightCard>
            )}
          </div>
        )}

        {/* Committee Debrief active View */}
        {activeSimulation && debriefData && (
          <div className="space-y-6 fade-up">
            
            {/* Top Scorecard and Recommendation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-5">
              <div>
                <span className="inline-block bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 font-mono">
                  <Scale size={10} className="inline mr-1" /> Committee Consensus
                </span>
                <h1 className="font-display text-2xl font-bold text-ink">
                  {roleTitle || "Target Role"} Debrief
                </h1>
                <p className="text-xs text-ink-muted mt-0.5">
                  Simulating panel feedback for {companyName || "Target Company"}
                </p>
              </div>

              {/* Consensus Verdict Indicator */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`border px-5 py-3 rounded-2xl shadow-sm text-center md:text-left ${getVerdictStyles(debriefData.overallRecommendation)}`}>
                  <span className="block text-[8px] font-mono font-bold uppercase tracking-wider opacity-60">Committee Verdict</span>
                  <span className="text-lg font-black tracking-tight">{debriefData.overallRecommendation}</span>
                </div>

                <div className="flex items-center gap-2.5 bg-paper border border-border px-4 py-2.5 rounded-2xl shadow-sm">
                  <div className="text-right">
                    <span className="block text-[8px] font-mono font-bold uppercase tracking-wider text-ink-faint">Consensus Score</span>
                    <span className="text-xs font-semibold text-ink-muted">Averaged Match</span>
                  </div>
                  <div className="text-2xl font-black text-accent font-mono border-l border-border pl-3">
                    {consensusScore}%
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Panelists Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Sarah HR */}
              <SpotlightCard className={`glass-card bg-paper-card border rounded-2xl p-5 shadow flex items-center justify-between gap-4 transition-all duration-300 ${
                currentActiveSpeaker === "HR Recruiter" ? "border-pink-500/40 ring-1 ring-pink-500/20 bg-pink-950/5" : "border-border"
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${currentActiveSpeaker === "HR Recruiter" ? "bg-pink-500 animate-ping" : "bg-pink-500/40"}`} />
                    <h4 className="font-display text-sm font-bold text-ink">Sarah (HR Recruiter)</h4>
                  </div>
                  <p className="text-[10px] text-ink-muted font-mono leading-tight">Focus: Formatting, Spacing, Gaps, Syntax</p>
                </div>
                <div className="flex items-center gap-3">
                  {currentActiveSpeaker === "HR Recruiter" && (
                    <div className="flex items-end gap-[2px] h-4 text-pink-500">
                      <span className="w-[3px] bg-current rounded-full eq-bar-1" style={{ height: "12px" }} />
                      <span className="w-[3px] bg-current rounded-full eq-bar-2" style={{ height: "6px" }} />
                      <span className="w-[3px] bg-current rounded-full eq-bar-3" style={{ height: "10px" }} />
                    </div>
                  )}
                  <div className="text-2xl font-extrabold text-pink-400 font-mono">
                    {debriefData.hrScore}%
                  </div>
                </div>
              </SpotlightCard>

              {/* Alex EM */}
              <SpotlightCard className={`glass-card bg-paper-card border rounded-2xl p-5 shadow flex items-center justify-between gap-4 transition-all duration-300 ${
                currentActiveSpeaker === "Engineering Manager" ? "border-indigo-500/40 ring-1 ring-indigo-500/20 bg-indigo-950/5" : "border-border"
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${currentActiveSpeaker === "Engineering Manager" ? "bg-indigo-500 animate-ping" : "bg-indigo-500/40"}`} />
                    <h4 className="font-display text-sm font-bold text-ink">Alex (Engineering Mgr)</h4>
                  </div>
                  <p className="text-[10px] text-ink-muted font-mono leading-tight">Focus: Tech depth, scale, logic, tools</p>
                </div>
                <div className="flex items-center gap-3">
                  {currentActiveSpeaker === "Engineering Manager" && (
                    <div className="flex items-end gap-[2px] h-4 text-indigo-500">
                      <span className="w-[3px] bg-current rounded-full eq-bar-1" style={{ height: "8px" }} />
                      <span className="w-[3px] bg-current rounded-full eq-bar-2" style={{ height: "12px" }} />
                      <span className="w-[3px] bg-current rounded-full eq-bar-3" style={{ height: "6px" }} />
                    </div>
                  )}
                  <div className="text-2xl font-extrabold text-indigo-400 font-mono">
                    {debriefData.techScore}%
                  </div>
                </div>
              </SpotlightCard>

              {/* Emma PM */}
              <SpotlightCard className={`glass-card bg-paper-card border rounded-2xl p-5 shadow flex items-center justify-between gap-4 transition-all duration-300 ${
                currentActiveSpeaker === "Product Manager" ? "border-teal-500/40 ring-1 ring-teal-500/20 bg-teal-950/5" : "border-border"
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${currentActiveSpeaker === "Product Manager" ? "bg-teal-500 animate-ping" : "bg-teal-500/40"}`} />
                    <h4 className="font-display text-sm font-bold text-ink">Emma (Product Manager)</h4>
                  </div>
                  <p className="text-[10px] text-ink-muted font-mono leading-tight">Focus: Business impact, metrics, value</p>
                </div>
                <div className="flex items-center gap-3">
                  {currentActiveSpeaker === "Product Manager" && (
                    <div className="flex items-end gap-[2px] h-4 text-teal-500">
                      <span className="w-[3px] bg-current rounded-full eq-bar-1" style={{ height: "10px" }} />
                      <span className="w-[3px] bg-current rounded-full eq-bar-2" style={{ height: "6px" }} />
                      <span className="w-[3px] bg-current rounded-full eq-bar-3" style={{ height: "12px" }} />
                    </div>
                  )}
                  <div className="text-2xl font-extrabold text-teal-400 font-mono">
                    {debriefData.productScore}%
                  </div>
                </div>
              </SpotlightCard>

            </div>

            {/* Simulated Debrief Transcript Feed */}
            <SpotlightCard className="glass-card bg-paper-card border border-border rounded-2xl shadow-xl flex flex-col h-[50vh] overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-paper-warm/20 flex justify-between items-center flex-shrink-0">
                <span className="text-xs font-mono font-bold tracking-wider text-ink uppercase flex items-center gap-2">
                  <Mic size={11} /> Debrief Room Transcript Feed
                </span>
                
                {/* Playback controls */}
                <div className="flex items-center gap-3 print:hidden">
                  <button
                    type="button"
                    onClick={() => setIsPlayingDebrief(!isPlayingDebrief)}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-paper border border-border rounded-lg hover:bg-paper-warm text-ink transition cursor-pointer"
                  >
                    {isPlayingDebrief ? "Pause" : "Play"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingDebrief(false);
                      setVisibleMessageCount(debriefData.debriefTranscript.length);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-paper border border-border rounded-lg hover:bg-paper-warm text-ink transition cursor-pointer"
                  >
                    <ChevronsRight size={12} /> Skip
                  </button>
                  <span className="text-[10px] text-ink-muted font-mono">
                    {visibleMessageCount} of {debriefData.debriefTranscript.length}
                  </span>
                </div>
              </div>

              <div id="debrief-transcript-feed" className="p-5 flex-1 overflow-y-auto space-y-4">
                {debriefData.debriefTranscript.slice(0, visibleMessageCount).map((msg, i) => (
                  <div key={i} className="flex gap-4 items-start select-text max-w-4xl animate-fadeIn">
                    
                    {/* Speaker Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${getAvatarBg(msg.speaker)}`}>
                      {getAvatarLetter(msg.speaker)}
                    </div>

                    {/* Speech message block */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-ink">
                          {getSpeakerName(msg.speaker)}
                        </span>
                      </div>
                      <div className="bg-paper border border-border rounded-2xl px-4 py-2.5 text-xs text-ink leading-relaxed shadow-sm">
                        {msg.message}
                      </div>
                    </div>

                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </SpotlightCard>

            {/* Strengths and Weaknesses Comparison columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Strengths */}
              <SpotlightCard className="glass-card bg-paper-card border border-border p-6 rounded-2xl shadow space-y-3">
                <h4 className="font-display text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500" /> Strengths Highlighted
                </h4>
                <ul className="space-y-2">
                  {debriefData.strengthsDebated.map((str, i) => (
                    <li key={i} className="text-xs text-ink-muted flex items-start gap-2.5 leading-relaxed">
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </SpotlightCard>

              {/* Weaknesses */}
              <SpotlightCard className="glass-card bg-paper-card border border-border p-6 rounded-2xl shadow space-y-3">
                <h4 className="font-display text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
                  <XCircle size={13} className="text-rose-500" /> Weaknesses Identified
                </h4>
                <ul className="space-y-2">
                  {debriefData.weaknessesDebated.map((weak, i) => (
                    <li key={i} className="text-xs text-ink-muted flex items-start gap-2.5 leading-relaxed">
                      <XCircle size={12} className="text-rose-400" />
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </SpotlightCard>

            </div>

            {/* Actionable Remedies Section */}
            <SpotlightCard className="glass-card bg-paper-card border border-border p-6 rounded-2xl shadow space-y-3">
              <h4 className="font-display text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
                Actionable Committee Remedies
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debriefData.recommendedRemedies.map((rem, i) => (
                  <div key={i} className="bg-paper border border-border rounded-xl p-4 flex gap-3 items-start shadow-sm">
                    <span className="text-emerald-400 font-mono text-sm font-semibold shrink-0 bg-emerald-500/10 border border-emerald-500/20 w-6 h-6 rounded-lg flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-xs text-ink-muted leading-relaxed">{rem}</p>
                  </div>
                ))}
              </div>
            </SpotlightCard>

            {/* Actions Bar */}
            <div className="flex items-center justify-between bg-paper-card border border-border rounded-2xl p-4 shadow">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-ink-muted hover:text-ink bg-paper hover:bg-paper-warm transition cursor-pointer"
              >
                <ArrowLeft size={14} /> Exit Simulation
              </button>
              <button
                onClick={handleReset}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer shadow hover:scale-[1.01] active:scale-[1] transition"
              >
                Convene New Committee <ArrowRight size={14} />
              </button>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
