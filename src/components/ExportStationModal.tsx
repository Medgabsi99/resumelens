"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  X,
  Palette,
  FileText,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Share2,
} from "lucide-react";
import { playSound } from "@/lib/soundFx";
import { downloadResumeDocx } from "@/lib/docxExport";
import { downloadResumePdf } from "@/lib/pdf/downloadPdf";
import { downloadAtsPdfA } from "@/lib/pdf/atsPdfAExporter";
import { parseResume } from "@/lib/parseResume";
import type { ResumeStyleTokens } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resumeText: string;
  targetRole?: string;
  resumeStyleTokens?: ResumeStyleTokens;
  onOpenLinkedInBridge?: () => void;
}

export default function ExportStationModal({
  isOpen,
  onClose,
  resumeText,
  targetRole = "Software Engineer",
  resumeStyleTokens,
  onOpenLinkedInBridge,
}: Props) {
  const [selectedFormat, setSelectedFormat] = useState<
    "pdf-a" | "designer-pdf" | "clean-docx" | "linkedin"
  >("pdf-a");
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteExport = async () => {
    playSound("click");
    setIsExporting(true);
    setExportedSuccess(null);

    try {
      const parsed = parseResume(resumeText || "");

      if (selectedFormat === "pdf-a") {
        await downloadAtsPdfA(resumeText, { targetRole });
        playSound("success");
        setExportedSuccess("ATS-Certified PDF/A-1b downloaded successfully!");
      } else if (selectedFormat === "designer-pdf") {
        await downloadResumePdf("modern", parsed, targetRole);
        playSound("success");
        setExportedSuccess("Modern Executive Designer PDF downloaded successfully!");
      } else if (selectedFormat === "clean-docx") {
        await downloadResumeDocx(parsed, targetRole);
        playSound("success");
        setExportedSuccess("Clean Word DOCX document downloaded successfully!");
      } else if (selectedFormat === "linkedin") {
        playSound("apply");
        if (onOpenLinkedInBridge) {
          onOpenLinkedInBridge();
        } else {
          setExportedSuccess("LinkedIn Profile Bridge activated!");
        }
      }
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  const formats = [
    {
      id: "pdf-a" as const,
      title: "ATS-Certified PDF/A-1b",
      badge: "100% ATS Pass",
      badgeColor: "#10b981",
      icon: <ShieldCheck size={18} className="text-emerald-500" />,
      desc: "Zero column breaks, standard Helvetica font metrics, complete Dublin Core metadata. Guaranteed readable by Workday, Taleo, Greenhouse & iCIMS.",
      recommendation: "Best for online company portals & job boards",
    },
    {
      id: "designer-pdf" as const,
      title: "Modern Executive Designer PDF",
      badge: "Human Recruiter Approved",
      badgeColor: "#e05d2e",
      icon: <Palette size={18} className="text-amber-600" />,
      desc: "Designed with modern visual typography and subtle accent highlights. Optimized for human hiring managers and recruiter email attachments.",
      recommendation: "Best for direct recruiter email introductions & referrals",
    },
    {
      id: "clean-docx" as const,
      title: "Clean Single-Column Word / DOCX",
      badge: "Universal Compatibility",
      badgeColor: "#3b82f6",
      icon: <FileText size={18} className="text-blue-500" />,
      desc: "Lightweight, unstyled raw format formatted specifically for legacy application forms with zero styling artifacts.",
      recommendation: "Best for direct copy-paste into corporate portal textboxes",
    },
    {
      id: "linkedin" as const,
      title: "Direct LinkedIn Sync Profile Bridge",
      badge: "Viral Visibility",
      badgeColor: "#0a66c2",
      icon: <Share2 size={18} className="text-[#0a66c2]" />,
      desc: "1-Click bridge that transforms your resume into high-impact LinkedIn headlines, 1st-person conversational summary, and top 15 ranked skills.",
      recommendation: "Best for profile optimization & recruiter inbound outreach",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bento-card w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative text-ink rounded-3xl overflow-hidden bg-paper-card"
      >
        {/* ── Fixed Sticky Header ────────────────────────────── */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border flex items-center justify-between shrink-0 bg-paper-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
              <Download size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-ink">
                Multi-Format Export Command Station
              </h2>
              <p className="text-xs text-ink-muted">
                Select your delivery format based on where you are submitting your application.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound("click");
              onClose();
            }}
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-paper-warm transition shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Format Selector Body ─────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          {formats.map((fmt) => {
            const isSelected = selectedFormat === fmt.id;
            return (
              <div
                key={fmt.id}
                onClick={() => {
                  playSound("click");
                  setSelectedFormat(fmt.id);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 shadow-xs ${
                  isSelected
                    ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                    : "border-border bg-paper-warm/30 hover:bg-paper-warm/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {fmt.icon}
                    <span className="text-xs sm:text-sm font-bold text-ink">{fmt.title}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold"
                      style={{ background: `${fmt.badgeColor}18`, color: fmt.badgeColor }}
                    >
                      {fmt.badge}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition shrink-0 ${
                      isSelected ? "border-accent bg-accent text-white" : "border-border"
                    }`}
                  >
                    {isSelected && <CheckCircle2 size={12} />}
                  </div>
                </div>

                <p className="text-xs text-ink-muted leading-relaxed pl-7">{fmt.desc}</p>

                <div className="text-[11px] font-mono font-medium text-accent flex items-center gap-1 pl-7">
                  <span>💡 {fmt.recommendation}</span>
                </div>
              </div>
            );
          })}

          {/* Success Alert */}
          {exportedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{exportedSuccess}</span>
            </div>
          )}
        </div>

        {/* ── Fixed Sticky Pinned Footer ──────────────────────── */}
        <div className="p-4 sm:px-6 border-t border-border bg-paper-card flex items-center justify-end gap-3 shrink-0 shadow-lg">
          <button
            onClick={() => {
              playSound("click");
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-ink-muted hover:text-ink hover:bg-paper-warm transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-accent to-orange-600 hover:from-accent-hover hover:to-orange-700 shadow-md flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Preparing Export...</span>
              </span>
            ) : selectedFormat === "linkedin" ? (
              <>
                <span>Open LinkedIn Bridge</span>
                <ArrowRight size={14} />
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Download Selected Format</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
