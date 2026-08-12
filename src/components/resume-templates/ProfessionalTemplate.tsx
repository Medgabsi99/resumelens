"use client";

/**
 * ProfessionalTemplate — "Classic Pro" — matches Resume.io London / Zety Windsor
 *
 * Timeless single-column design used by Microsoft, Deloitte, and Big 4 hires.
 * Serif header, clean rule dividers, justified body copy.
 *
 * ATS COMPLIANCE: ✅ Full (single column, standard headings, real bullets)
 */

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import { type ResumeCustomStyle } from "../ResumeEditor/types";
import { DESIGN_TOKENS } from "@/lib/designTokens";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
  customStyle?: ResumeCustomStyle;
}

export default function ProfessionalTemplate({
  resumeText,
  targetRole,
  parsedData,
  customStyle,
}: Props) {
  const data = parsedData || parseResume(resumeText);
  const tokens = DESIGN_TOKENS.professional;
  const PRIMARY = customStyle?.primaryColor || tokens.primaryColor || "#1e3a8a";

  // Contact items for the header bar
  const contactItems = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    ...(data.contact.links || []),
  ].filter(Boolean) as string[];

  return (
    <div
      style={{
        fontFamily: "'Georgia', 'Palatino Linotype', 'Times New Roman', serif",
        maxWidth: "816px",
        margin: "0 auto",
        background: "#ffffff",
        color: "#111827",
        fontSize: "10.5pt",
        lineHeight: 1.6,
      }}
    >
      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: "36px 52px 0" }}>
        <div style={{ textAlign: "center", paddingBottom: "20px" }}>
          <h1
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "28pt",
              fontWeight: 700,
              color: PRIMARY,
              margin: "0 0 6px 0",
              letterSpacing: "0.02em",
            }}
          >
            {data.contact.name || "Your Name"}
          </h1>

          {targetRole && (
            <div
              style={{
                fontSize: "11pt",
                fontWeight: 400,
                color: "#6b7280",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "12px",
                fontFamily: "'Georgia', serif",
                fontStyle: "italic",
              }}
            >
              {targetRole}
            </div>
          )}

          {/* Contact row */}
          {contactItems.length > 0 && (
            <div
              style={{
                fontSize: "9.5pt",
                color: "#374151",
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "4px 0",
              }}
            >
              {contactItems.map((item, i) => (
                <React.Fragment key={i}>
                  <span>{item}</span>
                  {i < contactItems.length - 1 && (
                    <span style={{ margin: "0 10px", color: PRIMARY }}>|</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Triple-rule separator */}
        <div style={{ borderTop: `3px solid ${PRIMARY}`, margin: "0 0 2px" }} />
        <div style={{ borderTop: `1px solid ${PRIMARY}40`, margin: "0 0 24px" }} />
      </div>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "0 52px 40px" }}>
        {/* ── SUMMARY ─────────────────────────────────────────────────── */}
        {data.summary && (
          <ClassicSection title="Professional Summary" color={PRIMARY}>
            <p
              style={{
                margin: 0,
                textAlign: "justify",
                lineHeight: 1.75,
                color: "#374151",
                fontSize: "10.5pt",
              }}
            >
              {data.summary}
            </p>
          </ClassicSection>
        )}

        {/* ── EXPERIENCE ──────────────────────────────────────────────── */}
        {data.experience.length > 0 && (
          <ClassicSection title="Professional Experience" color={PRIMARY}>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    gap: "4px",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "11pt", color: "#111827" }}>
                      {exp.title}
                    </span>
                    {exp.company && (
                      <span style={{ color: "#374151", fontStyle: "italic" }}>
                        {" "}
                        — {exp.company}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {exp.dates && (
                      <div style={{ fontSize: "9.5pt", color: "#6b7280", fontStyle: "italic" }}>
                        {exp.dates}
                      </div>
                    )}
                    {exp.location && (
                      <div style={{ fontSize: "9pt", color: "#9ca3af" }}>{exp.location}</div>
                    )}
                  </div>
                </div>
                {exp.bullets.length > 0 && (
                  <ul
                    style={{
                      margin: "6px 0 0",
                      paddingLeft: "22px",
                      fontSize: "10.5pt",
                      color: "#374151",
                      lineHeight: 1.7,
                    }}
                  >
                    {exp.bullets.map((b, j) => (
                      <li key={j} style={{ marginBottom: "5px" }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </ClassicSection>
        )}

        {/* ── PROJECTS ────────────────────────────────────────────────── */}
        {data.projects && data.projects.length > 0 && (
          <ClassicSection title="Key Projects" color={PRIMARY}>
            {data.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: "14px" }}>
                <span style={{ fontWeight: 700, fontSize: "10.5pt", color: "#111827" }}>
                  {p.name}
                </span>
                {p.description && (
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "10pt",
                      color: "#374151",
                      lineHeight: 1.65,
                    }}
                  >
                    {p.description}
                  </p>
                )}
              </div>
            ))}
          </ClassicSection>
        )}

        {/* ── EDUCATION ───────────────────────────────────────────────── */}
        {data.education.length > 0 && (
          <ClassicSection title="Education" color={PRIMARY}>
            {data.education.map((edu, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "4px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#111827" }}>{edu.degree}</div>
                  <div style={{ fontStyle: "italic", color: "#4b5563", fontSize: "10pt" }}>
                    {edu.school}
                  </div>
                  {edu.details && (
                    <div style={{ fontSize: "9.5pt", color: "#6b7280" }}>{edu.details}</div>
                  )}
                </div>
                {edu.dates && (
                  <span style={{ color: "#6b7280", fontSize: "9.5pt", fontStyle: "italic" }}>
                    {edu.dates}
                  </span>
                )}
              </div>
            ))}
          </ClassicSection>
        )}

        {/* ── SKILLS ──────────────────────────────────────────────────── */}
        {data.skills.length > 0 && (
          <ClassicSection title="Core Skills" color={PRIMARY}>
            <div style={{ fontSize: "10.5pt", color: "#374151", lineHeight: 1.8 }}>
              {data.skills.map((skill, i) => (
                <span key={i}>
                  {skill}
                  {i < data.skills.length - 1 && (
                    <span style={{ color: PRIMARY, margin: "0 8px" }}>·</span>
                  )}
                </span>
              ))}
            </div>
          </ClassicSection>
        )}

        {/* ── CERTIFICATIONS ──────────────────────────────────────────── */}
        {data.certifications && data.certifications.length > 0 && (
          <ClassicSection title="Certifications" color={PRIMARY}>
            <ul
              style={{
                margin: 0,
                paddingLeft: "22px",
                fontSize: "10.5pt",
                color: "#374151",
                lineHeight: 1.75,
              }}
            >
              {data.certifications.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </ClassicSection>
        )}

        {/* ── LANGUAGES ───────────────────────────────────────────────── */}
        {data.languages && data.languages.length > 0 && (
          <ClassicSection title="Languages" color={PRIMARY}>
            <div style={{ fontSize: "10.5pt", color: "#374151" }}>{data.languages.join(" · ")}</div>
          </ClassicSection>
        )}
      </div>
    </div>
  );
}

function ClassicSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <h2
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "11pt",
          fontWeight: 700,
          color,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          margin: "0 0 4px",
          paddingBottom: "4px",
          borderBottom: `1px solid ${color}50`,
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: "10px" }}>{children}</div>
    </div>
  );
}
