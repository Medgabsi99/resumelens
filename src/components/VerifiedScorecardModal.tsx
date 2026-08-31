"use client";

import React, { useState } from "react";
import ResponsiveModal from "./ResponsiveModal";
import {
  calculateScorePercentile,
  generateBadgeMarkdown,
  generateBadgeHtml,
  getLinkedInShareUrl,
  getTwitterShareUrl,
} from "@/lib/verifiedScorecard";
import { Award, Check, Copy, ExternalLink, Share2, ShieldCheck, Sparkles } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  analysisId?: string;
  score: number;
  targetRole?: string;
}

export default function VerifiedScorecardModal({
  isOpen,
  onClose,
  analysisId,
  score,
  targetRole = "Software Engineer",
}: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://resumelens.vercel.app";
  const verifyUrl = analysisId ? `${baseUrl}/verify/${analysisId}` : `${baseUrl}/verify/sample`;
  const { percentile, tier } = calculateScorePercentile(score);
  const badgeMarkdown = generateBadgeMarkdown(score, verifyUrl);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={520}
      title={
        <div className="flex items-center gap-2">
          <Award size={18} className="text-indigo-500" />
          <span>Share Verified Achievement</span>
        </div>
      }
    >
      <div className="flex flex-col gap-5 p-1 text-ink">
        {/* Certificate Preview Pill */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)",
            border: "1.5px solid rgba(99,102,241,0.25)",
            borderRadius: 16,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <ShieldCheck size={14} />
              <span>Verified ATS Scorecard</span>
            </div>
            <h3 className="text-base font-bold font-display text-ink m-0">{targetRole}</h3>
            <span className="text-xs text-ink-muted mt-0.5">
              🏆 {tier} Candidate (Top {100 - percentile}%)
            </span>
          </div>

          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "var(--paper-card)",
              border: "3px solid var(--accent)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
            }}
          >
            <span className="text-xl font-bold font-display leading-none text-ink">{score}</span>
            <span className="text-[9px] font-mono font-bold text-accent uppercase">ATS</span>
          </div>
        </div>

        {/* 1-Click Social Sharing Buttons */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted">
            1-Click Social Share
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* LinkedIn Share */}
            <a
              href={getLinkedInShareUrl(verifyUrl, score, targetRole)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-transform hover:scale-[1.02]"
              style={{ background: "#0a66c2", textDecoration: "none" }}
            >
              <span>Share to LinkedIn</span>
              <Share2 size={13} />
            </a>

            {/* Twitter/X Share */}
            <a
              href={getTwitterShareUrl(verifyUrl, score, targetRole)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-transform hover:scale-[1.02]"
              style={{ background: "#000000", textDecoration: "none" }}
            >
              <span>Share to X / Twitter</span>
              <Share2 size={13} />
            </a>
          </div>
        </div>

        {/* Direct Link Copy */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted">
            Verification URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={verifyUrl}
              className="flex-1 bg-paper-warm border border-border rounded-xl px-3 py-2 text-xs font-mono text-ink select-all outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{
                background: copiedLink ? "#10b981" : "var(--paper-card)",
                color: copiedLink ? "#ffffff" : "var(--ink)",
                border: "1px solid var(--border-strong)",
              }}
            >
              {copiedLink ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedLink ? "Copied" : "Copy"}</span>
            </button>
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-border-strong bg-paper-card text-ink-muted hover:text-ink transition-colors flex items-center justify-center"
              title="Open public verification page"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* GitHub README Badge Markdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted">
            GitHub README / Portfolio Badge
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={badgeMarkdown}
              className="flex-1 bg-paper-warm border border-border rounded-xl px-3 py-2 text-xs font-mono text-ink select-all outline-none"
            />
            <button
              onClick={handleCopyBadge}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{
                background: copiedBadge ? "#10b981" : "var(--paper-card)",
                color: copiedBadge ? "#ffffff" : "var(--ink)",
                border: "1px solid var(--border-strong)",
              }}
            >
              {copiedBadge ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedBadge ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
