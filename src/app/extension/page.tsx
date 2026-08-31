import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Download,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  Puzzle,
  ExternalLink,
  Laptop,
  Briefcase,
} from "lucide-react";

export const metadata = {
  title: "1-Click LinkedIn Job Match Extension | ResumeLens",
  description:
    "Instantly calculate ATS match scores and discover missing keywords directly inside LinkedIn, Indeed, and Glassdoor with the ResumeLens Chrome Extension.",
};

export default function ExtensionLandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-body selection:bg-indigo-500/30">
      {/* ── Navigation Header ─────────────────────────────────── */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-zinc-800/80">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Sparkles size={20} />
          </div>
          <span className="font-display font-bold text-xl text-white tracking-tight">
            ResumeLens
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to App
          </Link>
          <a
            href="https://github.com/Medgabsi99/resumelens/tree/master/chrome-extension"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors border border-zinc-700"
          >
            <Puzzle size={14} />
            <span>Extension GitHub</span>
          </a>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-bold mb-6">
          <Zap size={13} className="fill-indigo-400" />
          <span>Chrome & Edge Extension (Manifest V3)</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-3xl leading-[1.1] mb-6">
          Instant ATS match scores right inside{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-emerald-400">
            LinkedIn & Indeed
          </span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mb-10 leading-relaxed">
          No more copy-pasting job descriptions. The ResumeLens extension overlays your personalized
          ATS score and missing keywords directly on every job posting.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <a
            href="https://github.com/Medgabsi99/resumelens/tree/master/chrome-extension"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:scale-105 transition-transform shadow-xl shadow-indigo-500/25"
          >
            <Puzzle size={18} />
            <span>Get Extension for Chrome</span>
            <ArrowRight size={15} />
          </a>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-sm transition-colors border border-zinc-800"
          >
            <Laptop size={16} />
            <span>Web App Dashboard</span>
          </Link>
        </div>
      </section>

      {/* ── Interactive In-Page LinkedIn Preview Simulator ───── */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs font-mono text-zinc-500 ml-2">
                linkedin.com/jobs/view/senior-fullstack-engineer
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              Live Extension Simulation
            </span>
          </div>

          {/* Simulated Job Card */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-6 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Senior Full Stack Engineer (Next.js & Cloud)
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Acme AI Corp • San Francisco, CA (Hybrid) • $160K – $210K
              </p>
            </div>

            {/* Injected Action Buttons with ResumeLens Floating Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <button className="px-4 py-2 rounded-full bg-[#0a66c2] text-white font-bold text-xs cursor-default">
                Easy Apply
              </button>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 animate-pulse">
                <span>⚡</span>
                <span>88% ATS Match</span>
              </div>
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "1-Click ATS Audit",
                desc: "Instant candidate match calculation without leaving the job posting tab.",
                icon: ShieldCheck,
                color: "text-emerald-400",
              },
              {
                title: "Missing Keyword Gap",
                desc: "Shows high-value missing requirements to add to your bullet points.",
                icon: Zap,
                color: "text-indigo-400",
              },
              {
                title: "1-Click Job Tracker",
                desc: "Saves job details and target role to your ResumeLens application tracker.",
                icon: Briefcase,
                color: "text-amber-400",
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-2"
              >
                <feat.icon size={18} className={feat.color} />
                <h4 className="text-xs font-bold text-white font-display">{feat.title}</h4>
                <p className="text-xs text-zinc-400">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Step-by-Step Installation Guide ───────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="font-display text-2xl font-bold text-white text-center mb-8">
          How to Install in 30 Seconds
        </h2>

        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Open Chrome Extensions",
              desc: "Navigate to chrome://extensions in your Chrome or Edge browser.",
            },
            {
              step: "2",
              title: "Enable Developer Mode",
              desc: "Toggle the 'Developer mode' switch in the top right corner of the extensions page.",
            },
            {
              step: "3",
              title: "Load Unpacked Extension",
              desc: "Click 'Load unpacked' and select the /extension folder from your ResumeLens project.",
            },
            {
              step: "4",
              title: "Browse LinkedIn & Indeed",
              desc: "Visit any job posting to see live ATS match scores and 1-click tailoring!",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center text-sm shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-zinc-800 text-center text-xs text-zinc-600 font-mono">
        © {new Date().getFullYear()} ResumeLens Extension. Compatible with LinkedIn, Indeed,
        Glassdoor & Greenhouse.
      </footer>
    </div>
  );
}
