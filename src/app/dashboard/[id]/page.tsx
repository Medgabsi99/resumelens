import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import ResultsPanel from "@/components/ResultsPanel";
import { AnalysisResult } from "@/types";

export default async function PastAnalysisPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login?next=/dashboard/" + params.id);

  const admin = createAdminClient();

  // Fetch the analysis
  const { data: analysis, error } = await admin
    .from("analyses")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single();

  if (error || !analysis) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "DM Serif Display", fontSize: 24, marginBottom: 12 }}>Analysis not found</h1>
          <a href="/dashboard" style={{ color: "var(--accent)" }}>← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  // result_json might be a string or already parsed depending on DB driver
  const resultData: AnalysisResult =
    typeof analysis.result_json === "string"
      ? JSON.parse(analysis.result_json)
      : analysis.result_json;

  // Handle null safety for older analyses without resume_text/job_description
  const hasJD = !!analysis.job_description;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Background glow blobs */}
      <div className="glow-blob animate-blob-1 top-[-100px] right-[-50px] md:w-[500px] md:h-[500px]" />
      <div className="glow-blob animate-blob-2 bottom-[-100px] left-[-50px] md:w-[400px] md:h-[400px]" style={{ animationDelay: "-2s" }} />

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b flex items-center justify-between py-4 px-6 md:px-12 transition-all duration-300"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--border)",
        }}
      >
        <a href="/" className="font-display text-2xl font-bold tracking-tight no-underline text-ink">
          Resume<span className="text-accent">Lens</span>
        </a>
        <div className="flex items-center gap-6">
          <a
            href="/dashboard"
            className="text-sm font-semibold text-ink-muted hover:text-accent border border-border hover:border-accent-border px-4 py-2 rounded-xl no-underline transition-all duration-200"
            style={{ background: "var(--paper-card)" }}
          >
            ← Dashboard
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-8">
          <div className="font-mono text-xs text-ink-faint uppercase tracking-wider mb-2">
            {new Date(analysis.created_at).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            {analysis.target_role ? `Target Role: ${analysis.target_role}` : "General Resume Review"}
          </h1>
        </div>

        <ResultsPanel
          result={resultData}
          hasJD={hasJD}
          resumeText={analysis.resume_text || ""}
          jobDescription={analysis.job_description || undefined}
          targetRole={analysis.target_role || undefined}
          analysisId={analysis.id}
        />
      </div>
    </div>
  );
}
