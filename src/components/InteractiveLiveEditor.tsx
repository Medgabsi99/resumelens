"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import {
  parsedResumeToCanonical,
  canonicalToResumeText,
  type ResumeDocument,
  type ResumeExperience,
} from "@/types/resume";
import { runAtsChecks } from "@/lib/atsRulesChecker";
import { playSound } from "@/lib/soundFx";
import {
  Sparkles,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  TrendingUp,
  TrendingDown,
  Check,
  Zap,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Command,
  Flame,
  Target,
} from "lucide-react";

interface Props {
  initialResumeText: string;
  targetRole?: string;
  jobDescription?: string;
  initialScore?: number;
  onChange?: (updatedText: string, updatedScore: number) => void;
}

const SLASH_COMMANDS = [
  {
    id: "xyz",
    title: "Google XYZ Bullet",
    desc: "Accomplished [X] as measured by [Y] by doing [Z]",
    template:
      "Accomplished [X% improvement/scale] by implementing [specific technology/process], resulting in [quantifiable business outcome]",
    icon: Sparkles,
  },
  {
    id: "lead-verb",
    title: "High-Impact Action Verb",
    desc: "Spearheaded, Architected, Accelerated, Orchestrated",
    template: "Architected and spearheaded ",
    icon: Flame,
  },
  {
    id: "metric",
    title: "Quantified Latency / Scale Metric",
    desc: "Slashing latency by 45% across 200K+ DAU",
    template: ", reducing latency by 40% and scaling infrastructure to support 150K+ active users",
    icon: Zap,
  },
  {
    id: "ats",
    title: "ATS Keyword Injection",
    desc: "Targeted industry skills & technologies",
    template: " utilizing TypeScript, Next.js, PostgreSQL, and CI/CD automated pipelines",
    icon: Target,
  },
];

export default function InteractiveLiveEditor({
  initialResumeText,
  targetRole,
  jobDescription,
  initialScore = 75,
  onChange,
}: Props) {
  // Canonical resume document state
  const [doc, setDoc] = useState<ResumeDocument>(() => {
    const parsed = parseResume(initialResumeText || "");
    return parsedResumeToCanonical(parsed);
  });

  // History stack for Undo / Redo
  const [history, setHistory] = useState<ResumeDocument[]>([doc]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Live ATS score state
  const [liveScore, setLiveScore] = useState(initialScore);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);

  // Slash Command Menu State
  const [slashMenu, setSlashMenu] = useState<{
    open: boolean;
    expIdx: number;
    bulletIdx: number;
    position: { top: number; left: number };
  } | null>(null);

  // Floating AI Selection Popover State
  const [selectionPopover, setSelectionPopover] = useState<{
    visible: boolean;
    text: string;
    expIdx: number;
    bulletIdx: number;
    position: { top: number; left: number };
  } | null>(null);

  // Push new state to history stack
  const updateDoc = useCallback(
    (updater: (prev: ResumeDocument) => ResumeDocument) => {
      setDoc((prev) => {
        const next = updater(prev);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(next);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        return next;
      });
    },
    [history, historyIndex]
  );

  const undo = () => {
    if (historyIndex > 0) {
      playSound("undo");
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setDoc(history[nextIdx]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      playSound("click");
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setDoc(history[nextIdx]);
    }
  };

  // Recalculate ATS score when doc changes (debounced ~100ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const text = canonicalToResumeText(doc);
      const atsResult = runAtsChecks(text, targetRole);
      const newScore = atsResult.deterministicScore;

      setScoreDelta(newScore - initialScore);
      setLiveScore(newScore);
      onChange?.(text, newScore);
    }, 100);

    return () => clearTimeout(timer);
  }, [doc, targetRole, initialScore, onChange]);

  // Section text updater helpers
  const handleNameChange = (val: string) =>
    updateDoc((prev) => ({
      ...prev,
      contact: { ...(prev.contact || { name: "" }), name: val },
    }));
  const handleSummaryChange = (val: string) => updateDoc((prev) => ({ ...prev, summary: val }));

  const handleBulletChange = (
    expIdx: number,
    bulletIdx: number,
    val: string,
    e?: React.FormEvent<HTMLDivElement>
  ) => {
    // Check if user typed '/' to open slash menu
    if (val.endsWith("/")) {
      const target = e?.currentTarget;
      if (target) {
        const rect = target.getBoundingClientRect();
        setSlashMenu({
          open: true,
          expIdx,
          bulletIdx,
          position: { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX },
        });
      }
    } else if (slashMenu?.open) {
      setSlashMenu(null);
    }

    updateDoc((prev) => {
      const newExp = [...prev.experience];
      const newBullets = [...(newExp[expIdx]?.bullets || [])];
      newBullets[bulletIdx] = val;
      newExp[expIdx] = { ...newExp[expIdx], bullets: newBullets };
      return { ...prev, experience: newExp };
    });
  };

  const handleApplySlashCommand = (cmd: (typeof SLASH_COMMANDS)[0]) => {
    if (!slashMenu) return;
    playSound("apply");
    const { expIdx, bulletIdx } = slashMenu;

    updateDoc((prev) => {
      const newExp = [...prev.experience];
      const newBullets = [...(newExp[expIdx]?.bullets || [])];
      const current = newBullets[bulletIdx] || "";
      // Replace trailing '/' with command template
      const replaced = current.endsWith("/")
        ? current.slice(0, -1) + cmd.template
        : current + " " + cmd.template;
      newBullets[bulletIdx] = replaced;
      newExp[expIdx] = { ...newExp[expIdx], bullets: newBullets };
      return { ...prev, experience: newExp };
    });

    setSlashMenu(null);
  };

  const handleAddBullet = (expIdx: number) => {
    playSound("apply");
    updateDoc((prev) => {
      const newExp = [...prev.experience];
      const newBullets = [
        ...(newExp[expIdx]?.bullets || []),
        "Accomplished [X] by doing [Y] resulting in [Z]",
      ];
      newExp[expIdx] = { ...newExp[expIdx], bullets: newBullets };
      return { ...prev, experience: newExp };
    });
  };

  const handleRemoveBullet = (expIdx: number, bulletIdx: number) => {
    playSound("undo");
    updateDoc((prev) => {
      const newExp = [...prev.experience];
      const newBullets = (newExp[expIdx]?.bullets || []).filter((_, i) => i !== bulletIdx);
      newExp[expIdx] = { ...newExp[expIdx], bullets: newBullets };
      return { ...prev, experience: newExp };
    });
  };

  const handleMoveBullet = (expIdx: number, bulletIdx: number, direction: "up" | "down") => {
    playSound("click");
    updateDoc((prev) => {
      const newExp = [...prev.experience];
      const bullets = [...(newExp[expIdx]?.bullets || [])];
      const targetIdx = direction === "up" ? bulletIdx - 1 : bulletIdx + 1;
      if (targetIdx < 0 || targetIdx >= bullets.length) return prev;

      const temp = bullets[bulletIdx];
      bullets[bulletIdx] = bullets[targetIdx];
      bullets[targetIdx] = temp;

      newExp[expIdx] = { ...newExp[expIdx], bullets };
      return { ...prev, experience: newExp };
    });
  };

  // Text selection handler for floating AI popover
  const handleMouseUp = (expIdx: number, bulletIdx: number) => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 3) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPopover({
        visible: true,
        text: sel.toString().trim(),
        expIdx,
        bulletIdx,
        position: { top: rect.top + window.scrollY - 44, left: rect.left + window.scrollX },
      });
    } else {
      setSelectionPopover(null);
    }
  };

  const handleApplySelectionRewrite = (type: "stronger" | "quantify" | "keywords") => {
    if (!selectionPopover) return;
    playSound("apply");
    const { text, expIdx, bulletIdx } = selectionPopover;

    let rewritten = text;
    if (type === "stronger") {
      rewritten = `Spearheaded and delivered ${text.toLowerCase()}, accelerating release cadence`;
    } else if (type === "quantify") {
      rewritten = `${text}, cutting p99 latency by 38% and driving $120K annual cost reduction`;
    } else if (type === "keywords") {
      rewritten = `${text} using production TypeScript, Next.js, and cloud microservices`;
    }

    updateDoc((prev) => {
      const newExp = [...prev.experience];
      const newBullets = [...(newExp[expIdx]?.bullets || [])];
      const current = newBullets[bulletIdx] || "";
      newBullets[bulletIdx] = current.replace(text, rewritten);
      newExp[expIdx] = { ...newExp[expIdx], bullets: newBullets };
      return { ...prev, experience: newExp };
    });

    setSelectionPopover(null);
  };

  return (
    <div className="flex flex-col gap-3 w-full relative">
      {/* ── Top Editor Action Bar ────────────────────────────── */}
      <div className="bento-card p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs font-mono text-ink flex items-center gap-1.5">
            ✏️ Direct Canvas Editor
          </span>
          <span className="text-[10px] text-ink-muted hidden sm:inline">
            (Type <code className="px-1 py-0.5 rounded bg-paper-warm font-mono font-bold">/</code>{" "}
            for Notion commands)
          </span>
        </div>

        {/* Live Score & Delta Gauge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono font-bold text-indigo-500">
            <span>Score: {liveScore}</span>
            {scoreDelta !== null && scoreDelta !== 0 && (
              <span
                className={`text-[10px] flex items-center ${scoreDelta > 0 ? "text-emerald-500" : "text-rose-500"}`}
              >
                {scoreDelta > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg border border-border bg-paper-card text-ink disabled:opacity-30 hover:bg-paper-warm transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg border border-border bg-paper-card text-ink disabled:opacity-30 hover:bg-paper-warm transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Document Canvas ───────────────────────────────────── */}
      <div className="bento-card p-6 flex flex-col gap-5 text-ink">
        {/* Name Header */}
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleNameChange(e.currentTarget.textContent || "")}
          className="text-2xl font-bold font-mono tracking-tight outline-none focus:bg-accent/5 focus:ring-1 focus:ring-accent/40 rounded px-1 -mx-1"
        >
          {doc.contact?.name || "YOUR NAME"}
        </div>

        {/* Professional Summary */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-faint">
            Professional Summary
          </span>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleSummaryChange(e.currentTarget.textContent || "")}
            className="text-xs leading-relaxed outline-none focus:bg-accent/5 focus:ring-1 focus:ring-accent/40 rounded p-2 -m-1 border border-transparent focus:border-border transition"
          >
            {doc.summary || "Add your executive summary here..."}
          </div>
        </div>

        {/* Experience Section */}
        <div className="flex flex-col gap-4">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-faint">
            Experience & Key Accomplishments
          </span>

          {doc.experience.map((exp, expIdx) => (
            <div
              key={expIdx}
              className="p-3.5 rounded-xl border border-border bg-paper-warm/30 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">
                  {exp.title} • {exp.company}
                </span>
                <span className="text-[10px] text-ink-faint font-mono">
                  {exp.dates || "Present"}
                </span>
              </div>

              {/* Bullets List with Reorder Handles */}
              <div className="flex flex-col gap-1.5">
                {exp.bullets.map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="group relative flex items-start gap-1.5">
                    {/* Reorder Buttons */}
                    <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-0.5 shrink-0 pt-1 transition">
                      <button
                        onClick={() => handleMoveBullet(expIdx, bulletIdx, "up")}
                        disabled={bulletIdx === 0}
                        className="p-0.5 text-ink-muted hover:text-ink disabled:opacity-20"
                        title="Move bullet up"
                      >
                        <ChevronUp size={11} />
                      </button>
                      <button
                        onClick={() => handleMoveBullet(expIdx, bulletIdx, "down")}
                        disabled={bulletIdx === exp.bullets.length - 1}
                        className="p-0.5 text-ink-muted hover:text-ink disabled:opacity-20"
                        title="Move bullet down"
                      >
                        <ChevronDown size={11} />
                      </button>
                    </div>

                    <span className="text-accent text-xs font-bold mt-1 shrink-0">•</span>

                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) =>
                        handleBulletChange(expIdx, bulletIdx, e.currentTarget.textContent || "", e)
                      }
                      onMouseUp={() => handleMouseUp(expIdx, bulletIdx)}
                      className="text-xs leading-relaxed flex-1 outline-none focus:bg-accent/5 focus:ring-1 focus:ring-accent/40 rounded p-1"
                    >
                      {bullet}
                    </div>

                    <button
                      onClick={() => handleRemoveBullet(expIdx, bulletIdx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-ink-muted hover:text-rose-500 rounded transition shrink-0"
                      title="Delete bullet"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleAddBullet(expIdx)}
                className="self-start text-[11px] font-bold text-accent hover:text-accent-hover flex items-center gap-1 mt-1 transition"
              >
                <Plus size={12} /> Add Metric Bullet
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Notion Slash Menu Popover ─────────────────────────── */}
      <AnimatePresence>
        {slashMenu?.open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="slash-menu absolute z-50 p-1.5 w-72 flex flex-col gap-1 shadow-2xl"
            style={{ top: slashMenu.position.top, left: slashMenu.position.left }}
          >
            <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-ink-faint">
              Notion Insert Commands
            </div>
            {SLASH_COMMANDS.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleApplySlashCommand(cmd)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent-bg text-left transition group"
                >
                  <div className="p-1 rounded bg-paper-warm text-accent group-hover:bg-accent group-hover:text-white transition">
                    <Icon size={13} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-ink">{cmd.title}</span>
                    <span className="text-[10.5px] text-ink-muted leading-tight">{cmd.desc}</span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contextual Floating AI Text-Selection Popover ─────── */}
      <AnimatePresence>
        {selectionPopover?.visible && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="selection-popover absolute z-50 px-2 py-1.5 flex items-center gap-1.5 shadow-2xl"
            style={{ top: selectionPopover.position.top, left: selectionPopover.position.left }}
          >
            <span className="text-[10px] font-mono font-bold text-slate-400 px-1">AI Rewrite:</span>
            <button
              onClick={() => handleApplySelectionRewrite("stronger")}
              className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold text-white flex items-center gap-1 transition"
            >
              <Sparkles size={11} /> Executive
            </button>
            <button
              onClick={() => handleApplySelectionRewrite("quantify")}
              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white flex items-center gap-1 transition"
            >
              <Zap size={11} /> Quantify
            </button>
            <button
              onClick={() => handleApplySelectionRewrite("keywords")}
              className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-[11px] font-bold text-white flex items-center gap-1 transition"
            >
              <Target size={11} /> ATS Skills
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
