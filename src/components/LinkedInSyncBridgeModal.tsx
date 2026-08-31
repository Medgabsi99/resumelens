"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateLinkedInSyncPackage, type LinkedInSyncPackage } from "@/lib/linkedInBridge";
import { playSound } from "@/lib/soundFx";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  User,
  FileText,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

function LinkedinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resumeText: string;
  targetRole?: string;
}

export default function LinkedInSyncBridgeModal({
  isOpen,
  onClose,
  resumeText,
  targetRole,
}: Props) {
  const [activeTab, setActiveTab] = useState<"headline" | "about" | "experience" | "skills">(
    "headline"
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const pkg: LinkedInSyncPackage = generateLinkedInSyncPackage(resumeText, targetRole);

  const copyToClipboard = (text: string, key: string, deepLink?: string) => {
    playSound("apply");
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);

    if (deepLink) {
      window.open(deepLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <LinkedinIcon size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Direct LinkedIn Sync & Profile Bridge
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    Live Sync
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transfer your verified resume achievements directly into high-converting LinkedIn
                  profile sections
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                playSound("click");
                onClose();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {[
              { id: "headline", label: "Headlines (3 Archetypes)", icon: User },
              { id: "about", label: "1st-Person About Story", icon: FileText },
              { id: "experience", label: "Experience Highlights", icon: Briefcase },
              { id: "skills", label: "Top 15 Skills", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playSound("click");
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition -mb-px ${
                    isActive
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
            {/* ── Headline Tab ───────────────────────────────── */}
            {activeTab === "headline" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
                  <div className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Recruiter Insight:</strong> Headlines with explicit titles, core
                    technologies, and quantifiable authority receive{" "}
                    <strong>3.4x more recruiter InMail impressions</strong>.
                  </div>
                  <a
                    href={pkg.deepLinks.editIntro}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                  >
                    Open LinkedIn Intro Form <ExternalLink size={12} />
                  </a>
                </div>

                <div className="space-y-3">
                  {pkg.headlines.map((hl, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-2 hover:border-blue-300 dark:hover:border-blue-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {hl.archetype}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {hl.charCount} / 220 chars
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                        {hl.text}
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <button
                          onClick={() => copyToClipboard(hl.text, `hl-${idx}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                        >
                          {copiedKey === `hl-${idx}` ? (
                            <>
                              <Check size={12} className="text-emerald-500" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            copyToClipboard(hl.text, `hl-${idx}`, pkg.deepLinks.editIntro)
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                        >
                          <LinkedinIcon size={12} /> Copy & Open LinkedIn
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── About Tab ──────────────────────────────────── */}
            {activeTab === "about" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 flex items-center justify-between">
                  <div className="text-xs text-sky-800 dark:text-sky-300">
                    <strong>First-Person Storyteller:</strong> Written in a conversational,
                    high-authority tone with a 3-line preview hook and clear call-to-action.
                  </div>
                  <a
                    href={pkg.deepLinks.editAbout}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-[#0a66c2] dark:text-sky-400 hover:underline shrink-0"
                  >
                    Open LinkedIn About Form <ExternalLink size={12} />
                  </a>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-3">
                  <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200 max-h-80 overflow-y-auto p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    {pkg.aboutStory}
                  </pre>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => copyToClipboard(pkg.aboutStory, "about")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                    >
                      {copiedKey === "about" ? (
                        <>
                          <Check size={12} className="text-emerald-500" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy About Story
                        </>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(pkg.aboutStory, "about", pkg.deepLinks.editAbout)
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0a66c2] hover:bg-[#004182] text-white shadow-sm transition"
                    >
                      <LinkedinIcon size={12} /> Copy & Open LinkedIn About
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Experience Tab ─────────────────────────────── */}
            {activeTab === "experience" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>LinkedIn Description Format:</strong> Bulleted impact statements with
                    tagged technologies.
                  </div>
                  <a
                    href={pkg.deepLinks.editExperience}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                  >
                    Open LinkedIn Experience Form <ExternalLink size={12} />
                  </a>
                </div>

                <div className="space-y-3">
                  {pkg.experienceItems.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                          {exp.role} • {exp.company}
                        </span>
                        <span className="text-xs text-slate-400">{exp.dates}</span>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                        {exp.formattedText}
                      </pre>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => copyToClipboard(exp.formattedText, `exp-${idx}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                        >
                          {copiedKey === `exp-${idx}` ? (
                            <>
                              <Check size={12} className="text-emerald-500" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy Role Description
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Skills Tab ─────────────────────────────────── */}
            {activeTab === "skills" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                  <div className="text-xs text-emerald-800 dark:text-emerald-300">
                    <strong>LinkedIn Algorithm Priority:</strong> Pin these top 15 skills to match
                    recruiter query filters.
                  </div>
                  <a
                    href={pkg.deepLinks.editSkills}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
                  >
                    Open LinkedIn Skills Form <ExternalLink size={12} />
                  </a>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {pkg.pinnedSkills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50"
                      >
                        #{idx + 1} {sk}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          pkg.pinnedSkills.join(", "),
                          "skills",
                          pkg.deepLinks.editSkills
                        )
                      }
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                    >
                      <LinkedinIcon size={12} /> Copy Skills & Open LinkedIn
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
