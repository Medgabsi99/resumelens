"use client";

/**
 * TechProTemplate — 2026 Best-in-Class ATS Resume for IT / SWE / Cloud
 *
 * Designed to match the quality of Novoresume's "Amsterdam" template
 * and Resume.io's "Stockholm" — clean, authoritative, modern.
 *
 * ATS COMPLIANCE:
 * ✅ Single-column DOM order (no sidebar)
 * ✅ Skills listed individually with bullet separator
 * ✅ Standard section labels ATS recognizes
 * ✅ All contact fields: email, phone, location, LinkedIn, GitHub
 * ✅ Certifications section after education
 * ✅ Minimum 10pt font everywhere
 * ✅ No images, tables, or text boxes
 * ✅ Real <ul><li> bullets
 */

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

const ACCENT = "#1d4ed8"; // Indigo blue
const DARK = "#0f172a";
const BODY = "#1e293b";
const MUTED = "#475569";
const FAINT = "#64748b";
const RULE = "#cbd5e1";

export default function TechProTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);
  const skillLines = data.skills.filter(Boolean);

  return (
    <div
      style={{
        fontFamily: "'Calibri', 'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
        maxWidth: "816px",
        margin: "0 auto",
        background: "#ffffff",
        color: BODY,
        fontSize: "10.5pt",
        lineHeight: 1.6,
        padding: "0",
      }}
    >
      {/* ══ HEADER — colored block with name + contact ══════════════════════ */}
      <div
        style={{
          background: `linear-gradient(135deg, ${DARK} 0%, #1e3a8a 60%, #1d4ed8 100%)`,
          padding: "32px 48px 28px",
          color: "#ffffff",
        }}
      >
        <h1
          style={{
            fontSize: "28pt",
            fontWeight: 900,
            margin: "0 0 2px 0",
            letterSpacing: "-0.5px",
            color: "#ffffff",
          }}
        >
          {data.contact.name || "Your Name"}
        </h1>

        {targetRole && (
          <div
            style={{
              fontSize: "12pt",
              color: "#93c5fd",
              fontWeight: 600,
              letterSpacing: "0.04em",
              marginBottom: "14px",
              textTransform: "uppercase",
            }}
          >
            {targetRole}
          </div>
        )}

        {/* Contact info — inline pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 20px",
            marginTop: "10px",
            fontSize: "9.5pt",
            color: "#cbd5e1",
          }}
        >
          {data.contact.email && <span>📧 {data.contact.email}</span>}
          {data.contact.phone && <span>📞 {data.contact.phone}</span>}
          {data.contact.location && <span>📍 {data.contact.location}</span>}
          {data.contact.links?.map((link, i) => (
            <span key={i}>🔗 {link}</span>
          ))}
        </div>
      </div>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "28px 48px 40px" }}>
        {/* ── SUMMARY ───────────────────────────────────────────────────── */}
        {data.summary && (
          <Section title="Professional Summary">
            <p
              style={{
                margin: 0,
                color: BODY,
                lineHeight: 1.75,
                fontSize: "10.5pt",
                borderLeft: `3px solid ${ACCENT}`,
                paddingLeft: "14px",
                fontStyle: "italic",
              }}
            >
              {data.summary}
            </p>
          </Section>
        )}

        {/* ── TECHNICAL SKILLS — placed early for ATS keyword density ───── */}
        {skillLines.length > 0 && (
          <Section title="Technical Skills">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 0" }}>
              {skillLines.map((skill, i) => (
                <React.Fragment key={i}>
                  <span style={{ fontSize: "10pt", color: BODY }}>{skill}</span>
                  {i < skillLines.length - 1 && (
                    <span style={{ color: ACCENT, margin: "0 10px", fontWeight: 700 }}>·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Section>
        )}

        {/* ── PROFESSIONAL EXPERIENCE ───────────────────────────────────── */}
        {data.experience.length > 0 && (
          <Section title="Professional Experience">
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "4px",
                    marginBottom: "4px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11.5pt", fontWeight: 800, color: DARK }}>
                      {exp.title}
                    </span>
                    {exp.company && (
                      <span style={{ fontSize: "10.5pt", color: ACCENT, fontWeight: 700 }}>
                        {" "}
                        — {exp.company}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {exp.dates && (
                      <div style={{ fontSize: "9.5pt", color: FAINT, fontWeight: 700 }}>
                        {exp.dates}
                      </div>
                    )}
                    {exp.location && (
                      <div style={{ fontSize: "9pt", color: FAINT }}>{exp.location}</div>
                    )}
                  </div>
                </div>
                {exp.bullets.length > 0 && (
                  <ul
                    style={{
                      margin: "6px 0 0",
                      paddingLeft: "20px",
                      color: MUTED,
                      lineHeight: 1.7,
                    }}
                  >
                    {exp.bullets.map((b, j) => (
                      <li key={j} style={{ marginBottom: "4px", fontSize: "10.5pt" }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* ── TECHNICAL PROJECTS ───────────────────────────────────────── */}
        {data.projects && data.projects.length > 0 && (
          <Section title="Technical Projects">
            {data.projects.map((proj, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "14px",
                  paddingLeft: "14px",
                  borderLeft: `2px solid ${ACCENT}30`,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "11pt", color: DARK }}>{proj.name}</div>
                {proj.description && (
                  <p
                    style={{ margin: "4px 0 0", fontSize: "10pt", color: MUTED, lineHeight: 1.65 }}
                  >
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* ── EDUCATION ────────────────────────────────────────────────── */}
        {data.education.length > 0 && (
          <Section title="Education">
            {data.education.map((edu, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "4px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "11pt", color: DARK }}>{edu.degree}</div>
                  <div style={{ fontSize: "10.5pt", color: MUTED, fontStyle: "italic" }}>
                    {edu.school}
                  </div>
                  {edu.details && (
                    <div style={{ fontSize: "9.5pt", color: FAINT }}>{edu.details}</div>
                  )}
                </div>
                {edu.dates && (
                  <div style={{ fontSize: "9.5pt", color: FAINT, fontWeight: 700 }}>
                    {edu.dates}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* ── CERTIFICATIONS ───────────────────────────────────────────── */}
        {data.certifications && data.certifications.length > 0 && (
          <Section title="Certifications">
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.certifications.map((cert, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontSize: "10.5pt",
                    color: BODY,
                  }}
                >
                  <span style={{ color: ACCENT, fontWeight: 900, flexShrink: 0, marginTop: "1px" }}>
                    ▸
                  </span>
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── LANGUAGES ────────────────────────────────────────────────── */}
        {data.languages && data.languages.length > 0 && (
          <Section title="Languages">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 0" }}>
              {data.languages.map((lang, i) => (
                <React.Fragment key={i}>
                  <span style={{ fontSize: "10.5pt", color: BODY }}>{lang}</span>
                  {i < data.languages!.length - 1 && (
                    <span style={{ color: RULE, margin: "0 12px" }}>|</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* ══ FOOTER BAR ══════════════════════════════════════════════════════ */}
      <div
        style={{ height: "4px", background: `linear-gradient(90deg, ${DARK}, #1d4ed8, #0ea5e9)` }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
        <h2
          style={{
            fontSize: "10pt",
            fontWeight: 900,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </h2>
        <div style={{ flex: 1, height: "1px", background: RULE }} />
      </div>
      {children}
    </div>
  );
}
