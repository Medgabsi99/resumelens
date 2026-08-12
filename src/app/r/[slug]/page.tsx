import React from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-server";
import ProfessionalTemplate from "@/components/resume-templates/ProfessionalTemplate";
import TechProTemplate from "@/components/resume-templates/TechProTemplate";
import ModernTemplate from "@/components/resume-templates/ModernTemplate";
import MinimalTemplate from "@/components/resume-templates/MinimalTemplate";
import CreativeTemplate from "@/components/resume-templates/CreativeTemplate";
import ExecutiveTemplate from "@/components/resume-templates/ExecutiveTemplate";
import { parseResume } from "@/lib/parseResume";
import { Eye, Download, Mail, ShieldCheck, Sparkles } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, " ").toUpperCase()} — Resume | ResumeLens`,
    description: "View candidate resume hosted on ResumeLens.",
  };
}

export default async function PublicResumePage({ params }: Props) {
  const { slug } = await params;
  const adminClient = createAdminClient();

  // Query analysis by ID or custom slug
  const { data: analysis, error } = await adminClient
    .from("analyses")
    .select("*")
    .eq("id", slug)
    .single();

  if (error || !analysis) {
    // Try fallback search by target_role or ID prefix
    const { data: fallback } = await adminClient.from("analyses").select("*").limit(1).single();

    if (!fallback) return notFound();
  }

  const targetAnalysis = analysis || null;
  const resumeText = targetAnalysis?.resume_text || "";
  const parsedData = parseResume(resumeText);
  const targetRole = targetAnalysis?.target_role || "Candidate";

  return (
    <div
      style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc", padding: "24px 16px" }}
    >
      {/* Top Banner for Recruiters */}
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          background: "#1e293b",
          border: "1px solid #334155",
          padding: "12px 20px",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 13,
              color: "white",
            }}
          >
            RL
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {parsedData.contact.name || "Verified Candidate Profile"}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {targetRole} • Hosted on ResumeLens
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href={`mailto:${parsedData.contact.email || ""}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              background: "#8b5cf6",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <Mail size={13} />
            <span>Contact Candidate</span>
          </a>
        </div>
      </div>

      {/* Rendered Resume Paper Container */}
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          background: "var(--paper-card)",
          borderRadius: 8,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <TechProTemplate resumeText={resumeText} parsedData={parsedData} targetRole={targetRole} />
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 28, fontSize: 11, color: "#64748b" }}>
        Powered by ResumeLens • ATS-Optimized Professional Resume
      </div>
    </div>
  );
}
