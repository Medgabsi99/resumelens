import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";
import { PLAN_LIMITS } from "@/lib/stripe";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgraded?: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login?next=/dashboard");

  const profile = await getUserProfile(session.user.id);
  const admin = createAdminClient();

  const { data: analyses } = await admin
    .from("analyses")
    .select("id, score, target_role, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const limit = PLAN_LIMITS[profile?.plan || "free"];
  const used = profile?.analyses_used || 0;
  const remaining = Math.max(0, limit - used);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--paper-card)" }}>
        <a href="/" style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, textDecoration: "none", color: "var(--ink)" }}>
          Resume<em style={{ color: "var(--accent)" }}>Lens</em>
        </a>
        <a href="/api/auth/signout" style={{ fontSize: 13, color: "var(--ink-muted)", textDecoration: "none" }}>Sign out</a>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {searchParams.upgraded && (
          <div style={{ background: "#edf7f2", border: "1px solid rgba(45,106,79,0.25)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, color: "#2d6a4f", fontSize: 14, fontWeight: 500 }}>
            🎉 You're now on the {profile?.plan === "monthly" ? "Pro Monthly" : "Lifetime"} plan. Unlimited analyses unlocked!
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
          <StatCard label="Plan" value={profile?.plan === "free" ? "Free" : profile?.plan === "monthly" ? "Pro Monthly" : "Lifetime"} />
          <StatCard label="Analyses run" value={String(used)} />
          <StatCard
            label="Remaining"
            value={remaining >= 999 ? "∞" : String(remaining)}
            sub={profile?.plan === "free" ? <a href="/pricing" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>Upgrade →</a> : undefined}
          />
        </div>

        {/* CTA */}
        <div style={{ marginBottom: 28 }}>
          <a
            href="/"
            style={{
              display: "inline-block",
              background: "var(--accent)",
              color: "white",
              textDecoration: "none",
              borderRadius: 10,
              padding: "11px 22px",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + Analyze a new resume
          </a>
        </div>

        {/* History */}
        <div>
          <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-faint)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            Past Analyses
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {(!analyses || analyses.length === 0) ? (
            <div style={{ background: "var(--paper-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 20px", textAlign: "center", color: "var(--ink-muted)", fontSize: 14 }}>
              No analyses yet. <a href="/" style={{ color: "var(--accent)" }}>Run your first one →</a>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {analyses.map((a) => (
                <a
                  key={a.id}
                  href={`/dashboard/${a.id}`}
                  style={{
                    background: "var(--paper-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.15s",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, color: "var(--ink)" }}>
                      {a.target_role || "General Resume Review"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "DM Mono, monospace" }}>
                      {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      fontFamily: "DM Serif Display, serif",
                      fontSize: 28,
                      color: a.score >= 75 ? "#2d6a4f" : a.score >= 55 ? "#92400e" : "#7a2020",
                    }}>
                      {a.score}
                    </div>
                    <div style={{ color: "var(--border-strong)" }}>→</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div style={{ background: "var(--paper-warm)", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontFamily: "DM Serif Display, serif", color: "var(--ink)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
