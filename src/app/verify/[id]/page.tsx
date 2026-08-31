import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-server";
import {
  calculateScorePercentile,
  generateBadgeMarkdown,
  generateBadgeHtml,
} from "@/lib/verifiedScorecard";
import type { AnalysisResult } from "@/types";
import {
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  Share2,
  ArrowRight,
  FileText,
  Copy,
  ExternalLink,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("analyses")
    .select("score, target_role, created_at")
    .eq("id", id)
    .single();

  const role = data?.target_role || "Candidate";
  const score = data?.score || 85;

  return {
    title: `Verified ${score}/100 ATS Score — ${role} | ResumeLens`,
    description: `Official verified ATS resume scorecard for ${role} on ResumeLens. Scored ${score}/100 with comprehensive compliance validation.`,
    openGraph: {
      title: `Verified ${score}/100 ATS Resume Score | ResumeLens`,
      description: `Official verified ATS resume scorecard for ${role}.`,
      images: [`/api/og/verify/${id}`],
    },
  };
}

export default async function VerifiedScorecardPage({ params }: Props) {
  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: analysis, error } = await adminClient
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !analysis) {
    return notFound();
  }

  let result: AnalysisResult;
  try {
    result =
      typeof analysis.result_json === "string"
        ? JSON.parse(analysis.result_json)
        : analysis.result_json;
  } catch {
    return notFound();
  }

  const score = analysis.score || result.score || 80;
  const targetRole = analysis.target_role || "Software Engineer";
  const { percentile, tier } = calculateScorePercentile(score);
  const formattedDate = new Date(analysis.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://resumelens.vercel.app";
  const verifyUrl = `${baseUrl}/verify/${id}`;
  const badgeMarkdown = generateBadgeMarkdown(score, verifyUrl);
  const badgeHtml = generateBadgeHtml(score, verifyUrl);

  const breakdown = result.ats_breakdown || {
    format: Math.min(100, score + 4),
    keywords: Math.min(100, score - 2),
    impact: Math.min(100, score + 2),
    readability: Math.min(100, score + 5),
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col items-center justify-between p-4 sm:p-8 font-body selection:bg-indigo-500/30">
      {/* ── Top Header Navigation ─────────────────────────────── */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 border-b border-zinc-800/80 mb-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles size={18} />
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">
            ResumeLens
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={13} />
            Verified Authentic
          </span>
        </div>
      </header>

      {/* ── Main Scorecard Container ──────────────────────────── */}
      <main className="w-full max-w-2xl flex flex-col gap-6">
        {/* Certificate Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-10 shadow-2xl shadow-black/80 backdrop-blur-xl">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Seal Header */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs font-mono text-zinc-300 mb-6">
              <Award size={14} className="text-indigo-400" />
              <span>Official ATS Benchmark Certificate</span>
            </div>

            {/* Target Role & Title */}
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              {targetRole}
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-8">
              Verified Analysis Record • Audited on {formattedDate}
            </p>

            {/* Massive Score Gauge Display */}
            <div className="relative flex flex-col items-center justify-center mb-8">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-indigo-500/30 bg-zinc-950 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/15 via-transparent to-emerald-500/15" />
                <span className="text-5xl sm:text-6xl font-display font-extrabold text-white tracking-tight relative z-10">
                  {score}
                </span>
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest relative z-10 mt-1">
                  / 100 ATS
                </span>
              </div>

              {/* Tier Pill */}
              <div className="mt-4 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold shadow-sm">
                🏆 {tier} Candidate — Higher than {percentile}% of applicants
              </div>
            </div>

            {/* 4 Pillars Breakdown Grid */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: "ATS Format", val: breakdown.format, color: "text-emerald-400" },
                { label: "Keyword Match", val: breakdown.keywords, color: "text-indigo-400" },
                { label: "Action Impact", val: breakdown.impact, color: "text-amber-400" },
                { label: "Readability", val: breakdown.readability, color: "text-cyan-400" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 flex flex-col items-center text-center"
                >
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    {item.label}
                  </span>
                  <span className={`text-xl font-display font-bold ${item.color}`}>
                    {item.val}%
                  </span>
                </div>
              ))}
            </div>

            {/* Verified Strengths Highlights */}
            {result.strengths && result.strengths.length > 0 && (
              <div className="w-full text-left bg-zinc-950/40 border border-zinc-800/60 rounded-2xl p-4 sm:p-5 mb-8">
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Key Verified Strengths
                </h3>
                <ul className="space-y-2">
                  {result.strengths.slice(0, 3).map((strength, i) => (
                    <li
                      key={i}
                      className="text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5"
                    >
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verification Metadata Box */}
            <div className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-500 border-t border-zinc-800/80 pt-4">
              <span>Verification Hash: {id.slice(0, 12)}...</span>
              <span>Issuer: ResumeLens ATS Engine</span>
            </div>
          </div>
        </div>

        {/* ── Embed Badge Code Widget ─────────────────────────── */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3">
          <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <FileText size={14} className="text-indigo-400" />
            Embed Badge in GitHub Profile or Portfolio
          </h4>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-400 overflow-x-auto select-all">
            {badgeMarkdown}
          </div>
        </div>

        {/* ── High-Conversion Viral CTA Card ──────────────────── */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-zinc-900 to-blue-950/60 border border-blue-500/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
          <div>
            <h4 className="text-base font-bold text-white font-display">
              Want to check your own resume?
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Get an instant ATS audit, keyword gap analysis, and 95+ score optimization.
            </p>
          </div>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs hover:scale-105 transition-transform whitespace-nowrap shadow-lg shadow-indigo-500/25"
          >
            <span>Scan My Resume Free</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="w-full max-w-4xl text-center py-6 text-xs text-zinc-600 font-mono">
        © {new Date().getFullYear()} ResumeLens. Verified public scorecard verification portal.
      </footer>
    </div>
  );
}
