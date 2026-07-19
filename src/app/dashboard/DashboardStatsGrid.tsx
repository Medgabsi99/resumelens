"use client";
import AnimatedNumber from "@/components/AnimatedNumber";
import SpotlightCard from "@/components/SpotlightCard";
import { Target, FileText, ClipboardList, Rocket } from "lucide-react";

interface Stats {
  avgScore: number;
  totalReviews: number;
  totalApps: number;
  successRate: number;
}

interface Props {
  stats: Stats;
  loading: boolean;
}

export default function DashboardStatsGrid({ stats, loading }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      <SpotlightCard className="glass-card bg-paper-card p-5 rounded-2xl border border-border flex flex-col justify-between">
        <div className="flex items-center justify-between text-ink-muted mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider font-mono">Avg Score</span>
          <Target size={16} className="text-accent" />
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-display">
            {loading ? <div className="skeleton h-10 w-16" /> : <AnimatedNumber value={stats.avgScore} zeroLabel="N/A" duration={900} />}
          </div>
          <div className="text-xs text-ink-muted flex items-center gap-1.5">
            {loading ? (
              <div className="skeleton h-3 w-28" />
            ) : stats.avgScore > 0 ? (
              <>
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${stats.avgScore >= 80 ? "bg-emerald-500" : stats.avgScore >= 60 ? "bg-amber-500" : "bg-rose-500"}`} />
                <span>Rating: {stats.avgScore >= 80 ? "Excellent" : stats.avgScore >= 60 ? "Good" : "Needs Review"}</span>
              </>
            ) : (
              <span>No analyses run</span>
            )}
          </div>
        </div>
      </SpotlightCard>

      <SpotlightCard className="glass-card bg-paper-card p-5 rounded-2xl border border-border flex flex-col justify-between">
        <div className="flex items-center justify-between text-ink-muted mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider font-mono">Total Reviews</span>
          <FileText size={16} className="text-accent" />
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-display">
            {loading ? <div className="skeleton h-10 w-12" /> : <AnimatedNumber value={stats.totalReviews} duration={750} />}
          </div>
          <div className="text-xs text-ink-muted">
            {loading ? <div className="skeleton h-3 w-36 mt-1" /> : "Resumes reviewed over time"}
          </div>
        </div>
      </SpotlightCard>

      <SpotlightCard className="glass-card bg-paper-card p-5 rounded-2xl border border-border flex flex-col justify-between">
        <div className="flex items-center justify-between text-ink-muted mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider font-mono">Tracked Jobs</span>
          <ClipboardList size={16} className="text-accent" />
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-display">
            {loading ? <div className="skeleton h-10 w-12" /> : <AnimatedNumber value={stats.totalApps} duration={750} />}
          </div>
          <div className="text-xs text-ink-muted">
            {loading ? <div className="skeleton h-3 w-40 mt-1" /> : "Applications in search tracker"}
          </div>
        </div>
      </SpotlightCard>

      <SpotlightCard className="glass-card bg-paper-card p-5 rounded-2xl border border-border flex flex-col justify-between">
        <div className="flex items-center justify-between text-ink-muted mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider font-mono">Interview Success</span>
          <Rocket size={16} className="text-accent" />
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-display">
            {loading ? <div className="skeleton h-10 w-16" /> : <AnimatedNumber value={stats.successRate} suffix="%" duration={1050} />}
          </div>
          <div className="text-xs text-ink-muted">
            {loading ? <div className="skeleton h-3 w-32 mt-1" /> : "Active funnel conversion"}
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
