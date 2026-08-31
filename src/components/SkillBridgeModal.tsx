"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  X,
  ExternalLink,
  Award,
  BookOpen,
  Code2,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { getSkillPathway, type SkillPathway } from "@/lib/skillBridge";
import { playSound } from "@/lib/soundFx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
}

export default function SkillBridgeModal({ isOpen, onClose, skillName }: Props) {
  const [copiedBullet, setCopiedBullet] = useState(false);
  if (!isOpen || !skillName) return null;

  const pathway: SkillPathway = getSkillPathway(skillName);

  const handleCopyBullet = () => {
    playSound("apply");
    navigator.clipboard.writeText(pathway.portfolioProject.resumeBullet);
    setCopiedBullet(true);
    setTimeout(() => setCopiedBullet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bento-card w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col p-6 sm:p-7 shadow-2xl relative text-ink"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            playSound("click");
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-paper-warm transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-ink">
              Skill Gap Bridge: {pathway.skill}
            </h2>
            <p className="text-xs text-ink-muted">
              Fast-track credentials &amp; portfolio projects to legitimately add this skill to your
              resume.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Top Industry Certification */}
          <div className="p-4 rounded-xl border border-border bg-paper-card flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Award size={13} /> Recommended Industry Credential
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {pathway.certification.badge}
              </span>
            </div>
            <h3 className="text-sm font-bold text-ink">{pathway.certification.name}</h3>
            <span className="text-xs text-ink-muted">
              Issued by {pathway.certification.provider}
            </span>
          </div>

          {/* Free Tutorial / Quickstart */}
          <div className="p-4 rounded-xl border border-border bg-paper-card flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <BookOpen size={13} /> Free Crash Course / Documentation
              </span>
              <span className="text-[10px] font-mono text-ink-faint">
                {pathway.freeTutorial.duration}
              </span>
            </div>
            <a
              href={pathway.freeTutorial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-accent hover:underline flex items-center gap-1.5 mt-0.5"
            >
              <span>{pathway.freeTutorial.title}</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* 1-Weekend Portfolio Project Blueprint */}
          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col gap-2">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
              <Code2 size={13} /> 1-Weekend Portfolio Project Idea
            </span>
            <h3 className="text-xs font-bold text-ink">{pathway.portfolioProject.title}</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              {pathway.portfolioProject.description}
            </p>

            <div className="mt-2 p-3 rounded-lg bg-paper-card border border-border flex flex-col gap-1.5">
              <span className="text-[10px] font-mono font-bold text-ink-faint uppercase">
                Ready-to-Use Resume Bullet:
              </span>
              <p className="text-xs font-medium text-ink italic leading-relaxed">
                &ldquo;{pathway.portfolioProject.resumeBullet}&rdquo;
              </p>
              <button
                onClick={handleCopyBullet}
                className="self-end px-2.5 py-1 rounded-md bg-paper-warm hover:bg-paper-card border border-border text-[11px] font-bold text-ink flex items-center gap-1 transition mt-1"
              >
                {copiedBullet ? (
                  <Check size={11} className="text-emerald-500" />
                ) : (
                  <Copy size={11} />
                )}
                <span>{copiedBullet ? "Copied!" : "Copy Bullet"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-end pt-4 border-t border-border mt-auto">
          <button
            onClick={() => {
              playSound("click");
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
