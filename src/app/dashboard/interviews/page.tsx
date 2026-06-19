"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import MockInterviewSimulatorBoard from "@/components/MockInterviewSimulatorBoard";
import { SkeletonHistoryCard } from "@/components/Skeleton";

interface ResumeItem {
  id: string;
  name: string;
  target_role: string | null;
  target_company: string | null;
  resume_text: string;
  job_description?: string | null;
}

interface SavedInterviewItem {
  id: string;
  role_title: string;
  company_name: string;
  interview_type: string;
  difficulty: string;
  questions: string[];
  transcripts: any[];
  overall_score: number;
  star_mastery: number;
  filler_words: Record<string, number>;
  created_at: string;
  isLocal?: boolean;
}

const GENERATING_STEPS = [
  "Reviewing resume details and background summary...",
  "Analyzing key competencies for target job requirements...",
  "Structuring behavioral and technical queries...",
  "Tailoring questions to target company environment...",
  "Initializing speech engine profiles...",
  "Assembling turn-by-turn interview simulation...",
];

export default function InterviewsPage() {
  const [mounted, setMounted] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [history, setHistory] = useState<SavedInterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup Form States
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewType, setInterviewType] = useState("behavioral");
  const [difficulty, setDifficulty] = useState("mid");

  // Loader transition states
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);

  // Active Simulator Board States
  const [activeQuestions, setActiveQuestions] = useState<string[] | null>(null);
  const [activeResumeText, setActiveResumeText] = useState("");

  // Past scorecard detail modal overlay
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SavedInterviewItem | null>(null);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumesRes, historyRes] = await Promise.all([
        fetch("/api/resumes"),
        fetch("/api/interviews/history"),
      ]);

      const resumesData = await resumesRes.json();
      const historyData = await historyRes.json();

      if (!resumesRes.ok || !resumesData.success) {
        throw new Error(resumesData.error || "Failed to load resumes");
      }
      setResumes(resumesData.data || []);

      // Grab DB History
      let dbHistory: SavedInterviewItem[] = [];
      if (historyRes.ok && historyData.success) {
        dbHistory = historyData.data || [];
      }

      // Grab local history fallbacks
      let localHistory: SavedInterviewItem[] = [];
      try {
        const local = localStorage.getItem("mock_interviews_local");
        if (local) {
          localHistory = JSON.parse(local).map((item: any) => ({ ...item, isLocal: true }));
        }
      } catch (err) {
        console.warn("Failed to load local storage mock interviews:", err);
      }

      const mergedHistory = [...dbHistory, ...localHistory].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHistory(mergedHistory);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load history data");
    } finally {
      setLoading(false);
    }
  };

  // Autofill company & role from selected resume
  const handleResumeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    const selected = resumes.find((r) => r.id === id);
    if (selected) {
      if (selected.target_role) setRoleTitle(selected.target_role);
      if (selected.target_company) setCompanyName(selected.target_company);
      if (selected.job_description) setJobDescription(selected.job_description);
    }
  };

  // Launch Simulator Generator Action
  const handleLaunchSimulator = async () => {
    const selected = resumes.find((r) => r.id === selectedResumeId);
    if (!selected || !roleTitle || !companyName) return;

    setGenerating(true);
    setError(null);
    setGenStep(0);

    const interval = setInterval(() => {
      setGenStep((s) => Math.min(s + 1, GENERATING_STEPS.length - 1));
    }, 2000);

    try {
      const res = await fetch("/api/interviews/questions/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: selected.resume_text,
          targetRole: roleTitle,
          companyName,
          jobDescription: jobDescription || undefined,
          interviewType,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate interview questions");
      }

      setActiveResumeText(selected.resume_text);
      setActiveQuestions(data.questions);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to compile custom questions set. Please retry.");
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  };

  // Delete history log item
  const handleDeleteItem = async (item: SavedInterviewItem) => {
    if (!confirm("Are you sure you want to delete this mock interview record?")) return;

    if (item.isLocal) {
      try {
        const local = localStorage.getItem("mock_interviews_local");
        if (local) {
          const updated = JSON.parse(local).filter((entry: any) => entry.id !== item.id);
          localStorage.setItem("mock_interviews_local", JSON.stringify(updated));
          setHistory((prev) => prev.filter((entry) => entry.id !== item.id));
        }
      } catch (err) {
        console.error("Local delete error:", err);
      }
    } else {
      try {
        const res = await fetch(`/api/interviews/history?id=${item.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to delete item");
        }
        setHistory((prev) => prev.filter((entry) => entry.id !== item.id));
      } catch (err: any) {
        alert(err.message || "Failed to delete log from database.");
      }
    }
  };

  const handleCloseBoard = () => {
    setActiveQuestions(null);
    setActiveResumeText("");
    loadData(); // Reload listings
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="fade-up max-w-5xl mx-auto space-y-8">
        
        {/* Page Titles */}
        {!activeQuestions && !generating && (
          <div className="space-y-1.5">
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink flex items-center gap-2">
              Mock Interview Simulator 🎙️
            </h1>
            <p className="text-ink-muted text-sm max-w-3xl">
              Practice situational, technical, and screening interviews tailored directly to your target company, role seniority, and resume background.
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading Step View */}
        {generating && (
          <div className="bg-paper-card border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-lg min-h-[350px]">
            <span className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <h3 className="font-display text-lg font-bold text-ink mt-2">
              {GENERATING_STEPS[genStep]}
            </h3>
            <p className="text-xs text-ink-muted">
              Leveraging Gemini models to customize specialized questions for your target profile
            </p>
          </div>
        )}

        {/* Core Layout Setup */}
        {!activeQuestions && !generating && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Launcher Setup Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-paper-card border border-border rounded-2xl p-6 space-y-5 shadow-lg">
                <h3 className="font-display text-lg font-bold text-ink border-b border-border pb-3 flex items-center gap-2">
                  🛠️ Configure Interview Setup
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Select Resume */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Select Base Resume
                    </label>
                    <select
                      value={selectedResumeId}
                      onChange={handleResumeChange}
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition"
                    >
                      <option value="">-- Choose resume from library --</option>
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.target_role || "No target role"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Role */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Target Role Title
                    </label>
                    <input
                      type="text"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition"
                    />
                  </div>

                  {/* Target Company */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Target Company
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Stripe"
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition"
                    />
                  </div>

                  {/* Focus Style */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Interview Focus Style
                    </label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition"
                    >
                      <option value="behavioral">Behavioral (STAR Method Check)</option>
                      <option value="technical">Technical (Coding / Design tradeoffs)</option>
                      <option value="screening">General Screening (Verification & achievements)</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Role Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition"
                    >
                      <option value="junior">Junior (Foundational concepts)</option>
                      <option value="mid">Mid-Level (Tradeoffs & implementation)</option>
                      <option value="senior">Senior (Architecture, leadership & STAR metrics)</option>
                    </select>
                  </div>

                  {/* Job Description Text */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Job Description / Requirements List (Optional)
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the target job description to allow AI to tailors questions exactly to the criteria."
                      rows={4}
                      className="w-full bg-paper border border-border rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-accent resize-vertical transition"
                    />
                  </div>

                </div>

                <button
                  onClick={handleLaunchSimulator}
                  disabled={!selectedResumeId || !roleTitle || !companyName}
                  className="w-full btn-gradient py-3 rounded-xl text-sm font-semibold shadow hover:scale-[1.01] active:scale-[1] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-[1] transition flex items-center justify-center gap-2 cursor-pointer text-white"
                >
                  🚀 Generate Custom Questions & Start Simulation
                </button>

              </div>
            </div>

            {/* Previous History List */}
            <div className="space-y-6">
              <div className="bg-paper-card border border-border rounded-2xl p-6 space-y-4 shadow-lg h-full">
                <h3 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-border pb-3">
                  🏆 Session History
                </h3>

                {loading ? (
                  <div className="space-y-3">
                    <SkeletonHistoryCard />
                    <SkeletonHistoryCard />
                    <SkeletonHistoryCard />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center text-xs text-ink-muted py-8">
                    <p>No completed interviews found.</p>
                    <p className="text-[10px] text-ink-faint mt-1">Configure your credentials above to run your first simulation!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="bg-paper border border-border p-3.5 rounded-xl space-y-2 hover:border-accent-border transition animate-fade-in relative group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-ink truncate max-w-[130px]" title={item.role_title}>
                              {item.role_title}
                            </h4>
                            <span className="text-[10px] text-ink-muted font-medium block">at {item.company_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {item.overall_score}%
                            </span>
                            {item.isLocal && (
                              <span className="bg-slate-500/10 text-slate-400 text-[8px] font-bold px-1 py-0.5 rounded border border-slate-500/20" title="Saved locally in browser">
                                LOCAL
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1 text-[9px] font-semibold">
                          <span className="bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 px-1.5 py-0.2 rounded">
                            {item.star_mastery}% STAR
                          </span>
                          <span className="bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 px-1.5 py-0.2 rounded capitalize">
                            {item.interview_type}
                          </span>
                        </div>

                        {/* Actions bar */}
                        <div className="flex justify-between items-center pt-2 border-t border-border/50 text-[10px] text-ink-muted">
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedHistoryItem(item)}
                              className="text-accent font-semibold hover:underline cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Active Simulation Workspace Overlay */}
        {activeQuestions && activeResumeText && (
          <MockInterviewSimulatorBoard
            questions={activeQuestions}
            resumeText={activeResumeText}
            jobDescription={jobDescription}
            roleTitle={roleTitle}
            companyName={companyName}
            interviewType={interviewType}
            difficulty={difficulty}
            onClose={handleCloseBoard}
          />
        )}

        {/* Saved Past Scorecard Detail Dialog Overlay */}
        {selectedHistoryItem && (
          <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#121216] border border-[#2c2c38] rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto text-slate-100 font-sans">
              
              {/* Header */}
              <div className="text-center border-b border-[#2c2c38]/50 pb-5 relative">
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="absolute right-0 top-0 text-ink-muted hover:text-ink border border-border px-2.5 py-1 rounded-lg text-xs"
                >
                  ✕ Close
                </button>
                <div className="text-3xl mb-2">🎓</div>
                <h3 className="font-display text-2xl font-bold text-ink">Saved Interview Scorecard</h3>
                <p className="text-ink-muted text-sm mt-1">
                  {selectedHistoryItem.role_title} at <span className="font-semibold text-ink">{selectedHistoryItem.company_name}</span>
                </p>
                <div className="flex justify-center gap-2 mt-2.5 text-[10px] font-bold uppercase tracking-wider">
                  <span className="bg-[#1c1c24] text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                    {selectedHistoryItem.interview_type}
                  </span>
                  <span className="bg-[#1c1c24] text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                    Level: {selectedHistoryItem.difficulty}
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Score */}
                <div className="bg-[#181822] border border-[#2c2c38] p-4 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Match Score</span>
                  <span className="text-3xl font-extrabold text-indigo-400 mt-1">{selectedHistoryItem.overall_score}%</span>
                </div>

                {/* STAR Mastery */}
                <div className="bg-[#181822] border border-[#2c2c38] p-4 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">STAR Mastery</span>
                  <span className="text-3xl font-extrabold text-emerald-400 mt-1">{selectedHistoryItem.star_mastery}%</span>
                </div>

                {/* Filler count */}
                <div className="bg-[#181822] border border-[#2c2c38] p-4 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Filler words used</span>
                  <span className="text-3xl font-extrabold text-amber-400 mt-1">
                    {Object.values(selectedHistoryItem.filler_words || {}).reduce((a, b) => a + b, 0)}
                  </span>
                </div>

              </div>

              {/* Filler Words Frequencies */}
              {selectedHistoryItem.filler_words && (
                <div className="space-y-2">
                  <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">Filler word occurrences</h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                    {Object.entries(selectedHistoryItem.filler_words).map(([w, c]) => (
                      <div key={w} className="bg-[#181822] border border-border/50 p-2 rounded-lg flex justify-between">
                        <span className="text-ink-muted font-mono">"{w}"</span>
                        <span className="font-bold">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcripts dialogue check list */}
              <div className="space-y-3">
                <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-[#2c2c38]/50 pb-2">
                  Conversation Transcripts
                </h4>

                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                  {selectedHistoryItem.transcripts?.map((s, idx) => (
                    <div key={idx} className="bg-[#181822] border border-[#2c2c38] rounded-xl p-4 space-y-2 text-xs">
                      <div className="font-bold text-indigo-400">
                        Q{idx + 1}: {s.question}
                      </div>
                      <div className="text-ink-muted bg-[#121216] border border-border/50 p-2.5 rounded-lg leading-relaxed italic">
                        "{s.answer}"
                      </div>
                      <div className="text-[11px] leading-relaxed pt-1.5 border-t border-[#2c2c38]/40">
                        <strong>Grade Feedback (Score: {s.score}/10):</strong> <span className="text-ink-muted">{s.feedback}</span>
                      </div>
                      {s.sampleAnswer && (
                        <div className="text-[11px] text-emerald-400 leading-relaxed pt-1 border-t border-dashed border-[#2c2c38]/40">
                          <strong>Coach Suggestion:</strong> "{s.sampleAnswer}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
