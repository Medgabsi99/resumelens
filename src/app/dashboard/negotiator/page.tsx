"use client";
import { logger } from "@/lib/logger";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { SkeletonHistoryCard } from "@/components/Skeleton";
import { type NegotiationOffer, type NegotiationScorecard } from "@/lib/ai";
import { useToast } from "@/components/ToastProvider";
import EmptyState from "@/components/EmptyState";
import dynamic from "next/dynamic";

const SalaryNegotiatorBoard = dynamic(() => import("@/components/SalaryNegotiatorBoard"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-muted">Loading Negotiator Board...</div>,
});

interface ResumeItem {
  id: string;
  name: string;
  target_role: string | null;
  target_company: string | null;
  resume_text: string;
}

interface ScorecardItem {
  id: string;
  role_title: string;
  company_name: string;
  scenario: string;
  initial_offer: NegotiationOffer;
  final_offer: NegotiationOffer;
  score: number;
  verdict: string;
  feedback: NegotiationScorecard;
  created_at: string;
  isLocal?: boolean;
}

export default function NegotiatorPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [mounted, setMounted] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [history, setHistory] = useState<ScorecardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup Form States
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [scenario, setScenario] = useState("initial_offer");

  // Custom compensation offer values
  const [base, setBase] = useState(110000);
  const [bonus, setBonus] = useState(5);
  const [equity, setEquity] = useState(15000);
  const [signOn, setSignOn] = useState(5000);
  const [other, setOther] = useState("Standard health benefits, 15 days PTO");

  // Active Simulator States
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [activeResumeText, setActiveResumeText] = useState("");
  const [activeInitialOffer, setActiveInitialOffer] = useState<NegotiationOffer | null>(null);

  // Detailed Modal View State
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ScorecardItem | null>(null);

  // Load resumes and history
  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch resumes & database history
      const [resumesRes, historyRes] = await Promise.all([
        fetch("/api/resumes"),
        fetch("/api/negotiation/history"),
      ]);

      const resumesData = await resumesRes.json();
      const historyData = await historyRes.json();

      if (!resumesRes.ok || !resumesData.success) {
        throw new Error(resumesData.error || "Failed to load resumes");
      }
      setResumes(resumesData.data || []);

      // Grab db items
      let dbHistory: ScorecardItem[] = [];
      if (historyRes.ok && historyData.success) {
        dbHistory = historyData.data || [];
      }

      // Grab local history fallbacks
      let localHistory: ScorecardItem[] = [];
      try {
        const local = localStorage.getItem("salary_negotiations_local");
        if (local) {
          localHistory = JSON.parse(local).map((item: any) => ({ ...item, isLocal: true }));
        }
      } catch (err) {
        logger.warn("Failed to load local storage fallback history:", err);
      }

      // Merge both list (sorted by date desc)
      const mergedHistory = [...dbHistory, ...localHistory].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHistory(mergedHistory);
    } catch (err: any) {
      logger.error(err);
      setError(err.message || "Failed to fetch page data");
    } finally {
      setLoading(false);
    }
  };

  // Update scenario defaults
  useEffect(() => {
    if (scenario === "initial_offer") {
      setBase(110000);
      setBonus(5);
      setEquity(15000);
      setSignOn(5000);
      setOther("Standard health benefits, 15 days PTO");
    } else if (scenario === "performance_review") {
      setBase(130000);
      setBonus(10);
      setEquity(25000);
      setSignOn(0);
      setOther("Remote work 2 days/week");
    } else if (scenario === "competing_offer") {
      setBase(145000);
      setBonus(8);
      setEquity(40000);
      setSignOn(10000);
      setOther("Hybrid, $5k yearly education allowance");
    }
  }, [scenario]);

  // Autofill company & role from selected resume
  const handleResumeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    const selected = resumes.find((r) => r.id === id);
    if (selected) {
      if (selected.target_role) setRoleTitle(selected.target_role);
      if (selected.target_company) setCompanyName(selected.target_company);
    }
  };

  // Launch simulator
  const handleLaunchSimulator = () => {
    const selected = resumes.find((r) => r.id === selectedResumeId);
    if (!selected) return;

    setActiveResumeText(selected.resume_text);
    setActiveInitialOffer({
      base,
      bonus,
      equity,
      signOn,
      other,
    });
    setIsSimulatorActive(true);
  };

  // Delete history item
  const handleDeleteHistoryItem = async (item: ScorecardItem) => {
    if (!confirm("Are you sure you want to delete this scorecard log?")) return;

    if (item.isLocal) {
      // Delete from local storage
      try {
        const local = localStorage.getItem("salary_negotiations_local");
        if (local) {
          const updated = JSON.parse(local).filter((entry: any) => entry.id !== item.id);
          localStorage.setItem("salary_negotiations_local", JSON.stringify(updated));
          setHistory((prev) => prev.filter((entry) => entry.id !== item.id));
          toastSuccess("Scorecard deleted successfully.", "Deleted");
        }
      } catch (err) {
        logger.error("Local delete error:", err);
        toastError("Failed to delete local scorecard.");
      }
    } else {
      // Delete from DB
      try {
        const res = await fetch(`/api/negotiation/history?id=${item.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to delete item");
        }
        setHistory((prev) => prev.filter((entry) => entry.id !== item.id));
        toastSuccess("Scorecard deleted successfully.", "Deleted");
      } catch (err: any) {
        toastError(err.message || "Failed to delete entry from database.", "Delete Failed");
      }
    }
  };

  // Helper date formatter
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="fade-up max-w-5xl mx-auto">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink mb-1.5 flex items-center gap-2">
              Salary Negotiator 💰
            </h1>
            <p className="text-ink-muted text-sm">
              Practice compensation negotiation scenarios with our interactive AI Recruiter. Highlight your resume achievements to maximize your offers.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Launcher Configuration Setup */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-paper-card border border-border rounded-2xl p-6 space-y-5 shadow-lg">
              <h3 className="font-display text-lg font-bold text-ink border-b border-border pb-3 flex items-center gap-2">
                🎮 Setup Simulation Session
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Select Resume */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Select Baseline Resume
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

                {/* Scenario select */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Negotiation Scenario Heuristic
                  </label>
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    className="w-full bg-paper border border-border rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition"
                  >
                    <option value="initial_offer">Initial Job Offer (Candidate vs Recruiter)</option>
                    <option value="performance_review">Annual Performance Raise (Employee vs Manager)</option>
                    <option value="competing_offer">Counter competing offer match (Competing leverage)</option>
                  </select>
                </div>

              </div>

              {/* Offer Package Settings */}
              <div className="border-t border-border pt-4 space-y-4">
                <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">
                  Initial Offer Package Breakdown (Edit to customize)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Base Salary */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-ink-faint font-medium">Base Salary (USD / year)</label>
                    <input
                      type="number"
                      value={base}
                      onChange={(e) => setBase(parseInt(e.target.value) || 0)}
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2 text-sm text-ink outline-none focus:border-accent transition"
                    />
                  </div>

                  {/* Bonus */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-ink-faint font-medium">Target Performance Bonus (%)</label>
                    <input
                      type="number"
                      value={bonus}
                      onChange={(e) => setBonus(parseInt(e.target.value) || 0)}
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2 text-sm text-ink outline-none focus:border-accent transition"
                    />
                  </div>

                  {/* Equity */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-ink-faint font-medium">Equity/RSUs Value (USD total value)</label>
                    <input
                      type="number"
                      value={equity}
                      onChange={(e) => setEquity(parseInt(e.target.value) || 0)}
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2 text-sm text-ink outline-none focus:border-accent transition"
                    />
                  </div>

                  {/* Sign-on */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-ink-faint font-medium">Sign-on Bonus (USD)</label>
                    <input
                      type="number"
                      value={signOn}
                      onChange={(e) => setSignOn(parseInt(e.target.value) || 0)}
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2 text-sm text-ink outline-none focus:border-accent transition"
                    />
                  </div>

                  {/* Other perks */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs text-ink-faint font-medium">Other Perks / Benefits Details</label>
                    <input
                      type="text"
                      value={other}
                      onChange={(e) => setOther(e.target.value)}
                      placeholder="e.g. remote work days, health plans, tuition reimburse"
                      className="w-full bg-paper border border-border rounded-xl px-4 py-2 text-sm text-ink outline-none focus:border-accent transition"
                    />
                  </div>
                </div>
              </div>

              {/* Launcher Trigger Button */}
              <button
                onClick={handleLaunchSimulator}
                disabled={!selectedResumeId || !roleTitle || !companyName}
                className="w-full btn-gradient py-3 rounded-xl text-sm font-semibold shadow hover:scale-[1.01] active:scale-[1] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-[1] transition flex items-center justify-center gap-2 cursor-pointer text-white"
              >
                🎙️ Launch Salary Negotiation Simulator
              </button>

            </div>
          </div>

          {/* Right Column: Scorecard History Logs */}
          <div className="space-y-6">
            <div className="bg-paper-card border border-border rounded-2xl p-6 space-y-4 shadow-lg h-full">
              <h3 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-border pb-3">
                🏆 Scorecard History
              </h3>

              {loading ? (
                <div className="space-y-3">
                  <SkeletonHistoryCard />
                  <SkeletonHistoryCard />
                  <SkeletonHistoryCard />
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  illustration="negotiator"
                  title="No negotiations logged yet"
                  description="Complete your first salary negotiation simulation above. Your scorecards, tactics, and compensation gains will appear here."
                  compact
                />
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {history.map((item) => {
                    const finalTotal = item.final_offer.base + item.final_offer.equity + item.final_offer.signOn;
                    const initialTotal = item.initial_offer.base + item.initial_offer.equity + item.initial_offer.signOn;
                    const gain = Math.max(0, finalTotal - initialTotal);
                    
                    return (
                      <div
                        key={item.id}
                        className="bg-paper border border-border p-3.5 rounded-xl space-y-2 hover:border-accent-border transition animate-fade-in relative group"
                      >
                        {/* Header metadata */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-ink truncate max-w-[130px]" title={item.role_title}>
                              {item.role_title}
                            </h4>
                            <span className="text-[10px] text-ink-muted font-medium">at {item.company_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="bg-accent/10 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {item.score}%
                            </span>
                            {item.isLocal && (
                              <span className="bg-slate-500/10 text-slate-400 text-[8px] font-bold px-1 py-0.5 rounded border border-slate-500/20" title="Saved locally in browser">
                                LOCAL
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Outcomes details */}
                        <div className="flex justify-between items-center text-xs pt-1">
                          <span className="text-ink-muted capitalize text-[10px] bg-paper-card border border-border px-1.5 py-0.5 rounded">
                            {item.verdict}
                          </span>
                          {gain > 0 && (
                            <span className="text-emerald-400 font-bold text-[10px]">
                              +${gain.toLocaleString()} Gain
                            </span>
                          )}
                        </div>

                        {/* Hover action bar */}
                        <div className="flex justify-between items-center pt-2 border-t border-border/50 text-[10px] text-ink-muted">
                          <span>{formatDate(item.created_at)}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedHistoryItem(item)}
                              className="text-accent font-semibold hover:underline cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleDeleteHistoryItem(item)}
                              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Immersive Fullscreen Board */}
        {isSimulatorActive && activeInitialOffer && (
          <SalaryNegotiatorBoard
            resumeText={activeResumeText}
            roleTitle={roleTitle}
            companyName={companyName}
            scenario={scenario}
            initialOffer={activeInitialOffer}
            onClose={() => {
              setIsSimulatorActive(false);
              loadData(); // Reload scoreboard history
            }}
          />
        )}

        {/* Past Scorecard Details Overlay Modal */}
        {selectedHistoryItem && (
          <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-paper border border-border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto animate-scale-up text-slate-100 font-sans">
              
              {/* Header */}
              <div className="text-center border-b border-border pb-5 relative">
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="absolute right-0 top-0 text-ink-muted hover:text-ink border border-border px-2.5 py-1 rounded-lg text-xs"
                >
                  ✕ Close
                </button>
                <div className="text-3xl mb-2">🏆</div>
                <h3 className="font-display text-2xl font-bold text-ink">Saved Scorecard Result</h3>
                <p className="text-ink-muted text-sm mt-1">
                  {selectedHistoryItem.role_title} at <span className="font-semibold">{selectedHistoryItem.company_name}</span>
                </p>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Score */}
                <div className="bg-paper-card border border-border p-4 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Score</span>
                  <span className="text-3xl font-extrabold text-accent mt-1">{selectedHistoryItem.score}%</span>
                </div>

                {/* Package value Gain */}
                <div className="bg-paper-card border border-border p-4 rounded-xl flex flex-col items-center justify-center md:col-span-2">
                  <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Final Compensation Gain</span>
                  <span className="text-3xl font-extrabold text-emerald-400 mt-1">
                    +${(selectedHistoryItem.feedback?.financialGain || 0).toLocaleString()}
                  </span>
                </div>

              </div>

              {/* Tactics */}
              {selectedHistoryItem.feedback?.tacticsUsed && selectedHistoryItem.feedback.tacticsUsed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">Tactics Employed</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHistoryItem.feedback.tacticsUsed.map((tac) => (
                      <span
                        key={tac}
                        className="bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-lg text-xs font-medium"
                      >
                        {tac}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider text-emerald-400">Strengths</h4>
                  <ul className="space-y-1.5 text-xs text-ink-muted list-disc pl-4">
                    {selectedHistoryItem.feedback?.strengths?.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider text-rose-400">Areas to Improve</h4>
                  <ul className="space-y-1.5 text-xs text-ink-muted list-disc pl-4">
                    {selectedHistoryItem.feedback?.weaknesses?.map((wk, i) => (
                      <li key={i}>{wk}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Coaches Note */}
              <div className="space-y-2">
                <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">Coach Evaluation</h4>
                <p className="text-xs text-ink-muted leading-relaxed bg-paper-warm border border-border p-3.5 rounded-xl font-mono">
                  {selectedHistoryItem.feedback?.coachesNote}
                </p>
              </div>

              {/* Collapsible Transcript Viewer */}
              {selectedHistoryItem.feedback?.transcript && selectedHistoryItem.feedback.transcript.length > 0 && (
                <div className="border-t border-border pt-4 mt-2">
                  <details className="group">
                    <summary className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center justify-between cursor-pointer select-none">
                      <span>💬 View Negotiation Conversation Logs</span>
                      <span className="text-accent group-open:rotate-180 transition-transform duration-200">
                        ▼
                      </span>
                    </summary>
                    <div className="mt-4 space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {selectedHistoryItem.feedback.transcript.map((msg: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} text-xs`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-3.5 py-2 leading-relaxed shadow-sm ${
                              msg.role === "user"
                                ? "bg-accent text-white rounded-br-none"
                                : "bg-paper-card border border-border text-ink rounded-bl-none"
                            }`}
                          >
                            <div className="font-semibold text-[10px] opacity-60 mb-0.5">
                              {msg.role === "user" ? "You" : "Recruiter"}
                            </div>
                            <p className="whitespace-pre-line">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
