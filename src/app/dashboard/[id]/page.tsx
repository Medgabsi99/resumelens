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

  const resultData = JSON.parse(analysis.result_json) as AnalysisResult;
  const hasJD = !!analysis.job_description;

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--paper-card)" }}>
        <a href="/" style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, textDecoration: "none", color: "var(--ink)" }}>
          Resume<em style={{ color: "var(--accent)" }}>Lens</em>
        </a>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="/dashboard" style={{ fontSize: 13, color: "var(--ink-muted)", textDecoration: "none" }}>← Dashboard</a>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontFamily: "DM Mono", color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            {new Date(analysis.created_at).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: 32 }}>
            {analysis.target_role ? `Target Role: ${analysis.target_role}` : "General Resume Review"}
          </h1>
        </div>

        <ResultsPanel
          result={resultData}
          hasJD={hasJD}
          resumeText={analysis.resume_text}
          jobDescription={analysis.job_description}
          targetRole={analysis.target_role}
        />
      </div>
    </div>
  );
}
