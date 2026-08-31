"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, TrendingUp, Scissors, Check, X, ArrowRight, Plus } from "lucide-react";
import { playSound } from "@/lib/soundFx";

interface Props {
  selectedText: string;
  onApply: (newText: string) => void;
  onClose: () => void;
  targetRole?: string;
}

type TransformType = "polish" | "quantify" | "verb" | "concise";

export default function DirectCanvasGhostAi({
  selectedText,
  onApply,
  onClose,
  targetRole = "Software Engineer",
}: Props) {
  const [activeTransform, setActiveTransform] = useState<TransformType | null>(null);
  const [ghostPreview, setGhostPreview] = useState<string | null>(null);
  const [showScoreBurst, setShowScoreBurst] = useState(false);

  const cleanText = selectedText.trim();

  const handleTransform = (type: TransformType) => {
    playSound("click");
    setActiveTransform(type);

    let transformed = cleanText;

    if (type === "polish") {
      transformed = cleanText
        .replace(/^worked on/i, "Architected and delivered")
        .replace(/^helped/i, "Spearheaded key initiatives for")
        .replace(/^responsible for/i, "Orchestrated end-to-end execution of");
      if (!/delivered|architected|spearheaded/i.test(transformed)) {
        transformed = `Spearheaded ${cleanText.charAt(0).toLowerCase() + cleanText.slice(1)}, improving operational velocity and team SLA adherence.`;
      }
    } else if (type === "quantify") {
      if (!/\d+%|\$\d+|\d+x|\d+ms/i.test(cleanText)) {
        transformed = `${cleanText.replace(/\.$/, "")}, driving a 38% reduction in latency and saving 15+ engineering hours weekly.`;
      } else {
        transformed = cleanText.replace(/\d+%/g, "45%").replace(/\d+x/g, "3.5x");
      }
    } else if (type === "verb") {
      const verbs = ["Orchestrated", "Architected", "Engineered", "Pioneered", "Automated"];
      const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
      transformed = cleanText.replace(/^[A-Z][a-z]+ed\b|^[A-Z][a-z]+\b/, randomVerb);
    } else if (type === "concise") {
      transformed = cleanText
        .replace(/in order to/gi, "to")
        .replace(/responsible for/gi, "led")
        .replace(/assisted with/gi, "supported")
        .replace(/due to the fact that/gi, "because")
        .replace(/a variety of/gi, "multiple");
    }

    setGhostPreview(transformed);
  };

  const handleAccept = () => {
    if (!ghostPreview) return;
    playSound("apply");
    setShowScoreBurst(true);
    setTimeout(() => {
      onApply(ghostPreview);
      onClose();
    }, 600);
  };

  return (
    <div className="relative inline-block z-40">
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-dock p-2 rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 flex flex-col gap-2 min-w-[320px] max-w-md bg-white/95 dark:bg-[#0f141c]/95 backdrop-blur-xl text-ink"
      >
        {/* Top Wand Header & Close */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
            <Sparkles size={14} />
            <span>Inline Ghost AI</span>
          </div>
          <button
            onClick={() => {
              playSound("click");
              onClose();
            }}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-paper-warm transition"
          >
            <X size={13} />
          </button>
        </div>

        {/* 4 Action Pills */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleTransform("polish")}
            className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition ${
              activeTransform === "polish"
                ? "bg-accent text-white border-accent shadow-sm"
                : "border-border bg-paper-warm hover:bg-paper-card text-ink"
            }`}
          >
            <Sparkles
              size={13}
              className={activeTransform === "polish" ? "text-white" : "text-indigo-500"}
            />
            <span>Executive Polish</span>
          </button>

          <button
            onClick={() => handleTransform("quantify")}
            className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition ${
              activeTransform === "quantify"
                ? "bg-accent text-white border-accent shadow-sm"
                : "border-border bg-paper-warm hover:bg-paper-card text-ink"
            }`}
          >
            <TrendingUp
              size={13}
              className={activeTransform === "quantify" ? "text-white" : "text-emerald-500"}
            />
            <span>Quantify Metric</span>
          </button>

          <button
            onClick={() => handleTransform("verb")}
            className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition ${
              activeTransform === "verb"
                ? "bg-accent text-white border-accent shadow-sm"
                : "border-border bg-paper-warm hover:bg-paper-card text-ink"
            }`}
          >
            <Zap
              size={13}
              className={activeTransform === "verb" ? "text-white" : "text-amber-500"}
            />
            <span>Power Verb</span>
          </button>

          <button
            onClick={() => handleTransform("concise")}
            className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition ${
              activeTransform === "concise"
                ? "bg-accent text-white border-accent shadow-sm"
                : "border-border bg-paper-warm hover:bg-paper-card text-ink"
            }`}
          >
            <Scissors
              size={13}
              className={activeTransform === "concise" ? "text-white" : "text-rose-500"}
            />
            <span>Make Concise</span>
          </button>
        </div>

        {/* Ghost Preview Box */}
        {ghostPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs flex flex-col gap-2 mt-1"
          >
            <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
              ✨ Live Ghost Preview
            </span>
            <p className="text-xs font-medium text-ink leading-relaxed">
              &ldquo;{ghostPreview}&rdquo;
            </p>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-accent/20">
              <button
                onClick={() => setGhostPreview(null)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-ink-muted hover:text-ink transition"
              >
                Discard
              </button>
              <button
                onClick={handleAccept}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md transition"
              >
                <Check size={12} />
                <span>Accept Diff</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Real-time floating score burst */}
        <AnimatePresence>
          {showScoreBurst && (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -24, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute top-2 right-4 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold font-mono shadow-lg flex items-center gap-1 pointer-events-none"
            >
              <Plus size={11} />
              <span>3 pts</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
