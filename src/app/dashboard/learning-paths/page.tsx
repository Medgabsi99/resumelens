"use client";
import { logger } from "@/lib/logger";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { SkeletonHistoryCard } from "@/components/Skeleton";
import { type SkillGapPathResult } from "@/lib/ai";
import { useToast } from "@/components/ToastProvider";
import dynamic from "next/dynamic";

const LearningPathBoard = dynamic(() => import("@/components/LearningPathBoard"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-muted">Loading Learning Path...</div>,
});

interface ResumeItem {
  id: string;
  name: string;
  target_role: string | null;
  target_company: string | null;
  resume_text: string;
  job_description?: string | null;
}

interface SavedPathItem {
  id: string;
  role_title: string;
  company_name: string;
  missing_skills: string[];
  project_details: Record<string, unknown>;
  learning_path: Record<string, unknown>;
  created_at: string;
  isLocal?: boolean;
}

const GENERATING_STEPS = [
  "Comparing resume sections with job requirements...",
  "Identifying missing technical skills & tool sets...",
  "Designing custom portfolio project scope...",
  "Structuring weekly milestone training path...",
  "Compiling resources and coding exercises...",
  "Formatting boilerplate starter code file...",
];

export default function LearningPathsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [mounted, setMounted] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [history, setHistory] = useState<SavedPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup Form States
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Progress steps
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);

  // Active Workspace States
  const [activePathData, setActivePathData] = useState<SkillGapPathResult | null>(null);
  const [activePathId, setActivePathId] = useState<string>("");

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
        fetch("/api/learning-paths/history"),
      ]);

      const resumesData = await resumesRes.json();
      const historyData = await historyRes.json();

      if (!resumesRes.ok || !resumesData.success) {
        throw new Error(resumesData.error || "Failed to load resumes");
      }
      setResumes(resumesData.data || []);

      // DB History
      let dbHistory: SavedPathItem[] = [];
      if (historyRes.ok && historyData.success) {
        dbHistory = historyData.data || [];
      }

      // Local History Fallback
      let localHistory: SavedPathItem[] = [];
      try {
        const local = localStorage.getItem("learning_paths_local");
        if (local) {
          localHistory = JSON.parse(local).map((item: Partial<SavedPathItem>) => ({ ...item, isLocal: true }));
        }
      } catch (err) {
        logger.warn("Failed to load local storage learning paths:", err);
      }

      const mergedHistory = [...dbHistory, ...localHistory].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHistory(mergedHistory);
    } catch (err: unknown) {
      logger.error(err);
      setError((err as Error).message || "Failed to load page history.");
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

  // Build Learning Path action
  const handleBuildLearningPath = async () => {
    const selected = resumes.find((r) => r.id === selectedResumeId);
    if (!selected || !jobDescription.trim()) return;

    setGenerating(true);
    setError(null);
    setGenStep(0);

    const interval = setInterval(() => {
      setGenStep((s) => Math.min(s + 1, GENERATING_STEPS.length - 1));
    }, 2500);

    try {
      // 1. Generate path from API
      const res = await fetch("/api/learning-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: selected.resume_text,
          jobDescription,
          roleTitle,
          companyName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate learning path");
      }

      const generated: SkillGapPathResult = data.path;

      // 2. Save generated path resiliently
      const saveRes = await fetch("/api/learning-paths/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTitle: generated.roleTitle,
          companyName: generated.companyName,
          missingSkills: generated.missingSkills,
          projectDetails: generated.project,
          learningPath: generated.milestones,
        }),
      });

      const saveResult = await saveRes.json();
      let newId = "local_" + Date.now();

      if (saveRes.ok && saveResult.success && saveResult.savedInDb) {
        newId = saveResult.data.id;
      } else {
        // Local storage save fallback
        saveToLocalStorage(generated, newId);
      }

      setActivePathData(generated);
      setActivePathId(newId);
    } catch (err: unknown) {
      logger.error(err);
      setError((err as Error).message || "An error occurred while compiling your learning path.");
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  };

  const saveToLocalStorage = (pathData: SkillGapPathResult, newId: string) => {
    try {
      const local = localStorage.getItem("learning_paths_local");
      const localHistory = local ? JSON.parse(local) : [];
      const newItem = {
        id: newId,
        role_title: pathData.roleTitle,
        company_name: pathData.companyName,
        missing_skills: pathData.missingSkills,
        project_details: pathData.project,
        learning_path: pathData.milestones,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem("learning_paths_local", JSON.stringify([newItem, ...localHistory]));
    } catch (e) {
      logger.error("Local save exception:", e);
    }
  };

  // Delete history item
  const handleDeleteItem = async (item: SavedPathItem) => {
    if (!confirm("Are you sure you want to delete this learning path?")) return;

    if (item.isLocal) {
      try {
        const local = localStorage.getItem("learning_paths_local");
        if (local) {
          const updated = JSON.parse(local).filter((entry: { id: string }) => entry.id !== item.id);
          localStorage.setItem("learning_paths_local", JSON.stringify(updated));
          setHistory((prev) => prev.filter((entry) => entry.id !== item.id));
          toastSuccess("Learning path deleted successfully.", "Deleted");
        }
      } catch (err) {
        logger.error("Local delete error:", err);
        toastError("Failed to delete local learning path.");
      }
    } else {
      try {
        const res = await fetch(`/api/learning-paths/history?id=${item.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to delete item");
        }
        setHistory((prev) => prev.filter((entry) => entry.id !== item.id));
        toastSuccess("Learning path deleted successfully.", "Deleted");
      } catch (err: unknown) {
        toastError((err as Error).message || "Failed to delete entry from database.", "Delete Failed");
      }
    }
  };

  // Launch workspace from history
  const handleViewSavedPath = (item: SavedPathItem) => {
    const formatted: SkillGapPathResult = {
      roleTitle: item.role_title,
      companyName: item.company_name,
      missingSkills: item.missing_skills,
      project: item.project_details,
      milestones: item.learning_path,
    };
    setActivePathData(formatted);
    setActivePathId(item.id);
  };

  const handleCloseBoard = () => {
    setActivePathData(null);
    setActivePathId("");
    loadData(); // Reload list details
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="fade-up max-w-5xl mx-auto space-y-8">
        
        {/* Page Titles */}
        {!activePathData && !generating && (
          <div className="space-y-1.5">
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink flex items-center gap-2">
              Skill-Gap Learning Paths 🎓
            </h1>
            <p className="text-ink-muted text-sm max-w-3xl">
              Bridge technical gaps identified between your resume and a target job. Generate custom week-by-week learning curriculums and structured portfolio projects to demonstrate competency.
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
              Leveraging Gemini models to customize architecture configurations and Weekly timelines
            </p>
          </div>
        )}

        {/* Core Layout Setup */}
        {!activePathData && !generating && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Launcher Setup Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-paper-card border border-border rounded-2xl p-6 space-y-5 shadow-lg">
                <h3 className="font-display text-lg font-bold text-ink border-b border-border pb-3 flex items-center gap-2">
                  🛠️ Configure Skill-Gap Plan
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

                  {/* Job Description Text */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Target Job Description / Requirements List
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the target job description or paste a list of required technical tools you want to master."
                      rows={6}
                      className="w-full bg-paper border border-border rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-accent resize-vertical transition"
                    />
                  </div>

                </div>

                <button
                  onClick={handleBuildLearningPath}
                  disabled={!selectedResumeId || !roleTitle || !companyName || !jobDescription.trim()}
                  className="w-full btn-gradient py-3 rounded-xl text-sm font-semibold shadow hover:scale-[1.01] active:scale-[1] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-[1] transition flex items-center justify-center gap-2 cursor-pointer text-white"
                >
                  🚀 Build Learning Path & Project Roadmap
                </button>

              </div>
            </div>

            {/* Previous History List */}
            <div className="space-y-6">
              <div className="bg-paper-card border border-border rounded-2xl p-6 space-y-4 shadow-lg h-full">
                <h3 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-border pb-3">
                  🎓 Saved Pathways
                </h3>

                {loading ? (
                  <div className="space-y-3">
                    <SkeletonHistoryCard />
                    <SkeletonHistoryCard />
                    <SkeletonHistoryCard />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center text-xs text-ink-muted py-8">
                    <p>No saved pathways found.</p>
                    <p className="text-[10px] text-ink-faint mt-1">Configure your target credentials above to begin tracking!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="bg-paper border border-border p-3.5 rounded-xl space-y-2.5 hover:border-accent-border transition animate-fade-in relative group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-ink truncate max-w-[140px]" title={item.role_title}>
                              {item.role_title}
                            </h4>
                            <span className="text-[10px] text-ink-muted font-medium block">at {item.company_name}</span>
                          </div>
                          
                          {item.isLocal && (
                            <span className="bg-slate-500/10 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-500/20" title="Saved locally in browser">
                              LOCAL
                            </span>
                          )}
                        </div>

                        {/* Skill Badges */}
                        <div className="flex flex-wrap gap-1">
                          {item.missing_skills.slice(0, 3).map((sk) => (
                            <span key={sk} className="bg-emerald-500/5 text-emerald-400 text-[9px] font-semibold border border-emerald-500/10 px-1.5 py-0.2 rounded">
                              {sk}
                            </span>
                          ))}
                          {item.missing_skills.length > 3 && (
                            <span className="text-[9px] text-ink-faint font-medium">+{item.missing_skills.length - 3} more</span>
                          )}
                        </div>

                        {/* Actions bar */}
                        <div className="flex justify-between items-center pt-2 border-t border-border/50 text-[10px] text-ink-muted">
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewSavedPath(item)}
                              className="text-accent font-semibold hover:underline cursor-pointer"
                            >
                              Open Path
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

        {/* Active Timeline Workspace */}
        {activePathData && activePathId && (
          <LearningPathBoard
            data={activePathData}
            pathId={activePathId}
            onClose={handleCloseBoard}
          />
        )}

      </div>
    </DashboardLayout>
  );
}
