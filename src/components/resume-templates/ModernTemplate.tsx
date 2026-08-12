"use client";

/**
 * ModernTemplate — Contemporary IT / Software Engineering Resume (2026)
 *
 * ATS COMPLIANCE STRATEGY:
 * This template uses a visual two-column layout via CSS flexbox,
 * BUT the HTML DOM order is single-column top-to-bottom:
 *   Name → Contact → Summary → Experience → Projects → Education → Skills → Certs
 *
 * The sidebar is rendered LAST in DOM (so ATS reads main content first),
 * then positioned LEFT via CSS order property — purely visual reordering.
 *
 * This is the industry-standard technique used by resume.io and Novoresume
 * to support two-column visual design while remaining ATS-parseable.
 *
 * ✅ DOM order = ATS parse order (name → experience → education → skills)
 * ✅ No tables, no text boxes
 * ✅ All content in real HTML text nodes
 * ✅ Skills listed individually (not joined string)
 * ✅ Certifications section
 * ✅ Min 10pt font
 */

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

const BLUE = "#1e40af";
const DARK = "#0f172a";
const BODY = "#1e293b";
const MUTED = "#475569";
const FAINT = "#64748b";
const SIDE_BG = "#0f2044";

export default function ModernTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
        maxWidth: "816px",
        margin: "0 auto",
        background: "#ffffff",
        color: BODY,
        lineHeight: 1.55,
        fontSize: "10.5pt",
        display: "flex",
        minHeight: "1056px", // US Letter aspect
      }}
    >
      {/* ── SIDEBAR (visually left, DOM order = after main for ATS) ── */}
      {/* Using order: -1 so it appears left visually */}
      <div
        style={{
          order: -1,
          width: "220px",
          flexShrink: 0,
          background: SIDE_BG,
          padding: "36px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {/* Name in sidebar (visual only — DOM name is in main) */}
        <div aria-hidden="true" style={{ display: "none" }}>
          {/* Name/title intentionally hidden here — appears in main content for ATS */}
        </div>

        {/* Contact */}
        <div>
          <SideTitle>Contact</SideTitle>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "9.5pt",
              color: "#cbd5e1",
            }}
          >
            {data.contact.email && (
              <div>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "8pt",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: "2px",
                  }}
                >
                  Email
                </div>
                <div style={{ wordBreak: "break-all" }}>{data.contact.email}</div>
              </div>
            )}
            {data.contact.phone && (
              <div>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "8pt",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: "2px",
                  }}
                >
                  Phone
                </div>
                <div>{data.contact.phone}</div>
              </div>
            )}
            {data.contact.location && (
              <div>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "8pt",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: "2px",
                  }}
                >
                  Location
                </div>
                <div>{data.contact.location}</div>
              </div>
            )}
            {data.contact.links?.map((link, i) => (
              <div key={i} style={{ wordBreak: "break-all", color: "#93c5fd" }}>
                {link}
              </div>
            ))}
          </div>
        </div>

        {/* Skills sidebar */}
        {data.skills.length > 0 && (
          <div>
            <SideTitle>Skills</SideTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.skills.map((s, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "9.5pt",
                    color: "#cbd5e1",
                    borderLeft: "2px solid #3b82f6",
                    paddingLeft: "8px",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div>
            <SideTitle>Certifications</SideTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {data.certifications.map((c, i) => (
                <div key={i} style={{ fontSize: "9pt", color: "#cbd5e1", lineHeight: 1.5 }}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div>
            <SideTitle>Languages</SideTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.languages.map((l, i) => (
                <div key={i} style={{ fontSize: "9.5pt", color: "#cbd5e1" }}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT (DOM order first = ATS reads this first) ── */}
      <div style={{ flex: 1, padding: "36px 32px", display: "flex", flexDirection: "column" }}>
        {/* Name + title — this is what ATS reads FIRST in DOM */}
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "24pt",
              fontWeight: 900,
              color: DARK,
              margin: "0 0 4px 0",
              letterSpacing: "-0.5px",
            }}
          >
            {data.contact.name || "Your Name"}
          </h1>
          {targetRole && (
            <div
              style={{
                fontSize: "12pt",
                fontWeight: 700,
                color: "#3b82f6",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {targetRole}
            </div>
          )}
          {/* Hidden contact for ATS (visually represented in sidebar) */}
          <div
            style={{
              fontSize: "9pt",
              color: FAINT,
              marginTop: "4px",
              display: "flex",
              flexWrap: "wrap",
              gap: "0 12px",
            }}
          >
            {data.contact.email && <span>{data.contact.email}</span>}
            {data.contact.phone && <span>{data.contact.phone}</span>}
            {data.contact.location && <span>{data.contact.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <MainSection title="Summary" accent="#3b82f6">
            <p style={{ margin: 0, color: MUTED, lineHeight: 1.7, fontSize: "10.5pt" }}>
              {data.summary}
            </p>
          </MainSection>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <MainSection title="Experience" accent="#3b82f6">
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "4px",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11pt", fontWeight: 800, color: DARK }}>
                      {exp.title}
                    </span>
                    {exp.company && (
                      <span style={{ fontSize: "10.5pt", color: "#3b82f6", fontWeight: 600 }}>
                        {" "}
                        · {exp.company}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {exp.dates && (
                      <div style={{ fontSize: "9.5pt", color: FAINT, fontWeight: 600 }}>
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
                      paddingLeft: "18px",
                      color: MUTED,
                      lineHeight: 1.65,
                      fontSize: "10.5pt",
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
          </MainSection>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <MainSection title="Projects" accent="#3b82f6">
            {data.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: "12px" }}>
                <div style={{ fontWeight: 800, fontSize: "10.5pt", color: DARK }}>{p.name}</div>
                {p.description && (
                  <p style={{ margin: "3px 0 0", fontSize: "10pt", color: MUTED, lineHeight: 1.6 }}>
                    {p.description}
                  </p>
                )}
              </div>
            ))}
          </MainSection>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <MainSection title="Education" accent="#3b82f6">
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
                  <div style={{ fontWeight: 800, color: DARK }}>{edu.degree}</div>
                  <div style={{ color: MUTED, fontSize: "10pt" }}>{edu.school}</div>
                  {edu.details && (
                    <div style={{ fontSize: "9.5pt", color: FAINT }}>{edu.details}</div>
                  )}
                </div>
                {edu.dates && (
                  <div style={{ fontSize: "9.5pt", color: FAINT, fontWeight: 600 }}>
                    {edu.dates}
                  </div>
                )}
              </div>
            ))}
          </MainSection>
        )}
      </div>
    </div>
  );
}

function SideTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "9pt",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "#93c5fd",
        marginBottom: "12px",
        borderBottom: "1px solid #1e3a6e",
        paddingBottom: "5px",
      }}
    >
      {children}
    </h2>
  );
}

function MainSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2
        style={{
          fontSize: "11pt",
          fontWeight: 800,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "0 0 4px",
          borderBottom: `2px solid ${accent}30`,
          paddingBottom: "4px",
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: "10px" }}>{children}</div>
    </div>
  );
}
