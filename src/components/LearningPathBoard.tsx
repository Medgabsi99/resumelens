"use client";

import { useState, useEffect } from "react";
import { type SkillGapPathResult } from "@/lib/ai";

interface Props {
  data: SkillGapPathResult;
  pathId: string;
  onClose: () => void;
}

type TabType = "timeline" | "project";

export default function LearningPathBoard({ data, pathId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("timeline");
  const [completedWeeks, setCompletedWeeks] = useState<Record<number, boolean>>({});
  const [copiedCode, setCopiedCode] = useState(false);

  // Load progress checklist
  useEffect(() => {
    try {
      const progress = localStorage.getItem(`learning_path_progress_${pathId}`);
      if (progress) {
        setCompletedWeeks(JSON.parse(progress));
      }
    } catch (err) {
      console.warn("Failed to load progress states:", err);
    }
  }, [pathId]);

  // Toggle week checkbox
  const toggleWeekCompletion = (weekNum: number) => {
    const updated = { ...completedWeeks, [weekNum]: !completedWeeks[weekNum] };
    setCompletedWeeks(updated);
    try {
      localStorage.setItem(`learning_path_progress_${pathId}`, JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to save progress state:", err);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.project.starterSnippet.code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  // Calculate overall completion percent
  const totalWeeks = data.milestones.length || 4;
  const completedCount = Object.values(completedWeeks).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalWeeks) * 100);

  return (
    <div className="bg-paper border border-border rounded-2xl shadow-xl overflow-hidden font-sans text-slate-100 flex flex-col h-full min-h-[500px]">
      
      {/* Top Header details */}
      <div className="p-6 border-b border-border bg-paper-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-accent/15 text-accent border border-accent/20 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              🎓 Tailored Skill-Gap Path
            </span>
            <h2 className="font-display text-xl font-bold text-ink leading-none">
              {data.roleTitle} at {data.companyName}
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-ink-muted">Bridging skill gaps:</span>
            {data.missingSkills.map((sk) => (
              <span
                key={sk}
                className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-semibold"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>

        {/* Back and Progress actions */}
        <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Learning Progress</div>
              <div className="text-xs text-emerald-400 font-bold">{progressPercent}% Completed</div>
            </div>
            <div className="w-16 bg-paper h-2 rounded-full border border-border overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-paper border border-border text-ink hover:bg-paper-warm rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            ← Back to Setup
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="border-b border-border bg-paper flex">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 md:flex-none px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === "timeline" ? "border-accent text-accent bg-accent/5" : "border-transparent text-ink-muted hover:text-ink hover:bg-paper-warm"
          }`}
        >
          🎓 4-Week Study Timeline
        </button>
        <button
          onClick={() => setActiveTab("project")}
          className={`flex-1 md:flex-none px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === "project" ? "border-accent text-accent bg-accent/5" : "border-transparent text-ink-muted hover:text-ink hover:bg-paper-warm"
          }`}
        >
          🛠️ Custom Project Outline
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-6 overflow-y-auto">
        
        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="space-y-8 relative before:absolute before:top-4 before:bottom-4 before:left-6 before:w-[2px] before:bg-border/60">
            {data.milestones.map((milestone, idx) => {
              const completed = completedWeeks[milestone.week] || false;
              return (
                <div
                  key={milestone.week}
                  className={`relative pl-12 flex flex-col md:flex-row gap-6 transition ${
                    completed ? "opacity-75" : ""
                  }`}
                >
                  {/* Timeline bullet check */}
                  <button
                    onClick={() => toggleWeekCompletion(milestone.week)}
                    className={`absolute left-3.5 top-0.5 -translate-x-1/2 w-6.5 h-6.5 rounded-full border-2 flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                      completed
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-paper border-border text-ink-muted hover:border-accent hover:text-accent"
                    }`}
                    title={completed ? "Mark incomplete" : "Mark completed"}
                  >
                    {completed ? "✓" : milestone.week}
                  </button>

                  {/* Core details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className={`font-display text-base font-bold ${completed ? "text-slate-400 line-through" : "text-ink"}`}>
                        Week {milestone.week}: {milestone.title}
                      </h3>
                      <button
                        onClick={() => toggleWeekCompletion(milestone.week)}
                        className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded cursor-pointer transition ${
                          completed
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-500/5 text-slate-400 border-border/80 hover:border-accent/40"
                        }`}
                      >
                        {completed ? "Completed ✓" : "Mark Done"}
                      </button>
                    </div>

                    <p className="text-xs text-ink-muted leading-relaxed">
                      <strong>Goal:</strong> {milestone.objective}
                    </p>

                    {/* Expandable topics list */}
                    <div className="bg-paper-card border border-border rounded-xl p-4 space-y-3.5 shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Study Topics</span>
                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {milestone.topics.map((t, i) => (
                            <li key={i} className="text-xs text-ink-muted flex items-center gap-1.5 leading-none">
                              <span className="w-1 h-1 bg-accent rounded-full shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Official Links */}
                      {milestone.resources && milestone.resources.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider block">Recommended Guides</span>
                          <div className="flex flex-wrap gap-2">
                            {milestone.resources.map((res, i) => (
                              <a
                                key={i}
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-paper border border-border text-ink hover:bg-paper-warm hover:text-accent px-3 py-1 rounded-lg text-xs no-underline font-medium transition inline-flex items-center gap-1.5"
                              >
                                🔗 {res.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hands-on exercise description */}
                      <div className="border-t border-border pt-3 space-y-1">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Hands-on Exercise</span>
                        <p className="text-xs text-ink-muted leading-relaxed italic">
                          "{milestone.handsOnExercise}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Project Tab */}
        {activeTab === "project" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Title & Description */}
            <div className="bg-paper-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="font-display text-lg font-bold text-ink">
                🛠️ Tailored Project: {data.project.title}
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                {data.project.description}
              </p>

              <div className="flex flex-wrap gap-1.5 items-center pt-2">
                <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Project Stack:</span>
                {data.project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="bg-accent/15 text-accent border border-accent/20 px-2 py-0.5 rounded text-xs font-semibold"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Phases & starter code */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Phases */}
                <div className="space-y-3">
                  <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Project Build Phases
                  </h4>
                  
                  <div className="space-y-3">
                    {data.project.phases.map((phase, i) => (
                      <div key={i} className="bg-paper-card border border-border rounded-xl p-4 space-y-2">
                        <h5 className="text-xs font-bold text-ink">{phase.title}</h5>
                        <p className="text-[11px] text-ink-muted leading-relaxed">{phase.description}</p>
                        <ul className="text-xs text-slate-400 list-disc pl-4 space-y-1">
                          {phase.tasks.map((task, idx) => (
                            <li key={idx}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boilerplate code block */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Boilerplate Starter Code
                    </h4>
                    <span className="text-[10px] font-mono text-ink-faint">{data.project.starterSnippet.filePath}</span>
                  </div>

                  <div className="border border-border bg-[#0a0a0f] rounded-xl overflow-hidden shadow-inner flex flex-col">
                    <div className="px-4 py-2 bg-[#12121b] border-b border-border/80 flex justify-between items-center text-xs text-ink-muted font-mono">
                      <span>{data.project.starterSnippet.filePath}</span>
                      <button
                        onClick={handleCopyCode}
                        className="text-xs font-semibold text-accent hover:text-accent/80 transition cursor-pointer"
                      >
                        {copiedCode ? "✓ Copied!" : "Copy code"}
                      </button>
                    </div>
                    
                    <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-400/90 leading-normal max-h-[300px]">
                      <code>{data.project.starterSnippet.code}</code>
                    </pre>
                  </div>
                  
                  <p className="text-[11px] text-ink-muted leading-relaxed bg-paper-card border border-border p-3 rounded-lg font-mono">
                    <strong>Starter Explanation:</strong> {data.project.starterSnippet.explanation}
                  </p>
                </div>

              </div>

              {/* Right Col: Architecture Description */}
              <div className="space-y-4">
                <div className="bg-paper-card border border-border rounded-2xl p-5 space-y-3.5 shadow-sm h-full">
                  <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                    🔲 Architecture Blueprint
                  </h4>
                  
                  <p className="text-xs text-ink-muted leading-relaxed bg-paper border border-border/60 p-3 rounded-xl">
                    {data.project.architecture}
                  </p>

                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider block">Recommended Architecture blocks</span>
                    <div className="flex flex-col gap-2">
                      <div className="bg-[#12121b] border border-border/60 p-2.5 rounded-lg text-center">
                        <div className="text-xs font-bold text-accent">Frontend Layout</div>
                        <div className="text-[10px] text-ink-muted mt-0.5">Mock UI / SPA layer</div>
                      </div>
                      <div className="text-center text-xs text-ink-muted leading-none">↓ API Requests</div>
                      <div className="bg-[#12121b] border border-border/60 p-2.5 rounded-lg text-center">
                        <div className="text-xs font-bold text-accent">Core API Gateway</div>
                        <div className="text-[10px] text-ink-muted mt-0.5">Router / Controllers</div>
                      </div>
                      <div className="text-center text-xs text-ink-muted leading-none">↓ Async Actions</div>
                      <div className="bg-[#12121b] border border-border/60 p-2.5 rounded-lg text-center">
                        <div className="text-xs font-bold text-accent">Cache / Message Queue</div>
                        <div className="text-[10px] text-ink-muted mt-0.5">Bridging technologies</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
