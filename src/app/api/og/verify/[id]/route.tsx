import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const runtime = "edge";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from("analyses")
    .select("score, target_role")
    .eq("id", id)
    .single();

  const score = data?.score || 88;
  const targetRole = data?.target_role || "Software Engineer";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#09090b",
        backgroundImage: "radial-gradient(circle at 50% 30%, #1e1b4b 0%, #09090b 70%)",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "40px",
      }}
    >
      {/* Top Branding */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #e05d2e 0%, #c44d22 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
          }}
        >
          ✨
        </div>
        <span style={{ fontSize: "28px", fontWeight: "bold", letterSpacing: "-0.5px" }}>
          ResumeLens
        </span>
        <span
          style={{
            marginLeft: "12px",
            padding: "4px 12px",
            borderRadius: "20px",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            color: "#34d399",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          ✓ Verified Authentic
        </span>
      </div>

      {/* Role & Title */}
      <h1
        style={{
          fontSize: "44px",
          fontWeight: "800",
          textAlign: "center",
          margin: "0 0 16px 0",
          letterSpacing: "-1px",
        }}
      >
        {targetRole}
      </h1>

      {/* Score Badge Ring */}
      <div
        style={{
          width: "160px",
          height: "160px",
          borderRadius: "100px",
          backgroundColor: "#18181b",
          border: "4px solid #6366f1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 50px rgba(99, 102, 241, 0.3)",
          marginBottom: "24px",
        }}
      >
        <span style={{ fontSize: "68px", fontWeight: "900", lineHeight: 1 }}>{score}</span>
        <span
          style={{
            fontSize: "13px",
            color: "#a5b4fc",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginTop: "4px",
          }}
        >
          / 100 ATS
        </span>
      </div>

      {/* Bottom Tagline */}
      <p
        style={{
          fontSize: "18px",
          color: "#a1a1aa",
          margin: 0,
        }}
      >
        Official ATS Benchmark Scorecard • Verified on ResumeLens
      </p>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
