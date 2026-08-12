"use client";

/**
 * ExecutiveTemplate — Senior / C-Suite / Management (2026)
 * Inspired by: Harvard resume format, MIT Sloan style
 * ATS: ✅ Single column, standard headings, real bullets
 * Added: all contact links, certifications, locations, min 10pt font
 */

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import { DESIGN_TOKENS } from "@/lib/designTokens";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

const OXBLOOD = "#7a1c1c";
const DARK = "#111827";
const BODY = "#1f2937";
const MUTED = "#4b5563";

export default function ExecutiveTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);
  const tokens = DESIGN_TOKENS.executive;

  const contactItems = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    ...(data.contact.links || []),
  ].filter(Boolean) as string[];

  return (
    <div
      style={{
        fontFamily: tokens.fontFamily || "'Georgia', 'Palatino Linotype', serif",
        maxWidth: "816px",
        margin: "0 auto",
        padding: "40px 56px 48px",
        background: "#ffffff",
        color: BODY,
        lineHeight: 1.6,
        fontSize: "10.5pt",
      }}
    >
      {/* ── TOP RULE ─────────────────────────────────────────────────── */}
      <div style={{ height: "3px", background: DARK, marginBottom: "24px" }} />

      {/* ── NAME & CONTACT ───────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24pt",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: OXBLOOD,
            margin: "0 0 6px",
          }}
        >
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div
            style={{
              fontSize: "11pt",
              color: MUTED,
              fontWeight: "bold",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            {targetRole}
          </div>
        )}
        <div
          style={{
            fontSize: "10pt",
            color: MUTED,
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
                <span style={{ margin: "0 10px", color: OXBLOOD }}>|</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ height: "1px", background: DARK, marginBottom: "24px" }} />

      {/* ── SUMMARY ─────────────────────────────────────────────────── */}
      {data.summary && (
        <ExecSection title="Executive Summary">
          <p
            style={{
              margin: 0,
              fontSize: "11pt",
              color: BODY,
              textAlign: "justify",
              lineHeight: 1.75,
            }}
          >
            {data.summary}
          </p>
        </ExecSection>
      )}

      {/* ── EXPERIENCE ──────────────────────────────────────────────── */}
      {data.experience.length > 0 && (
        <ExecSection title="Professional History">
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
                <div style={{ fontWeight: "bold", fontSize: "11pt", color: DARK }}>
                  {exp.title}
                  {exp.company ? `, ${exp.company}` : ""}
                </div>
                <div style={{ textAlign: "right" }}>
                  {exp.dates && (
                    <div style={{ fontStyle: "italic", color: MUTED, fontSize: "10pt" }}>
                      {exp.dates}
                    </div>
                  )}
                  {exp.location && (
                    <div style={{ fontSize: "9.5pt", color: MUTED }}>{exp.location}</div>
                  )}
                </div>
              </div>
              {exp.bullets.length > 0 && (
                <ul
                  style={{
                    margin: "6px 0 0",
                    paddingLeft: "20px",
                    fontSize: "10.5pt",
                    color: BODY,
                    lineHeight: 1.65,
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
        </ExecSection>
      )}

      {/* ── PROJECTS ────────────────────────────────────────────────── */}
      {data.projects && data.projects.length > 0 && (
        <ExecSection title="Key Projects">
          {data.projects.map((p, i) => (
            <div key={i} style={{ marginBottom: "14px" }}>
              <div style={{ fontWeight: "bold", fontSize: "11pt", color: DARK }}>{p.name}</div>
              {p.description && (
                <p style={{ margin: "3px 0 0", fontSize: "10.5pt", color: BODY, lineHeight: 1.6 }}>
                  {p.description}
                </p>
              )}
            </div>
          ))}
        </ExecSection>
      )}

      {/* ── EDUCATION ───────────────────────────────────────────────── */}
      {data.education.length > 0 && (
        <ExecSection title="Education & Academic Credentials">
          {data.education.map((edu, i) => (
            <div
              key={i}
              style={{
                marginBottom: "14px",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "4px",
                fontSize: "11pt",
              }}
            >
              <div>
                <div style={{ fontWeight: "bold", color: DARK }}>{edu.degree}</div>
                <div
                  style={{
                    fontStyle: "italic",
                    color: MUTED,
                    fontSize: "10.5pt",
                    marginTop: "1px",
                  }}
                >
                  {edu.school}
                </div>
                {edu.details && <div style={{ fontSize: "10pt", color: MUTED }}>{edu.details}</div>}
              </div>
              {edu.dates && (
                <span style={{ color: MUTED, fontSize: "10pt", fontStyle: "italic" }}>
                  {edu.dates}
                </span>
              )}
            </div>
          ))}
        </ExecSection>
      )}

      {/* ── AREAS OF EXPERTISE ──────────────────────────────────────── */}
      {data.skills.length > 0 && (
        <ExecSection title="Areas of Expertise">
          <div style={{ fontSize: "10.5pt", color: BODY, lineHeight: 1.7 }}>
            {data.skills.map((s, i) => (
              <span key={i}>
                {s}
                {i < data.skills.length - 1 && (
                  <span style={{ margin: "0 8px", color: OXBLOOD }}>·</span>
                )}
              </span>
            ))}
          </div>
        </ExecSection>
      )}

      {/* ── CERTIFICATIONS ──────────────────────────────────────────── */}
      {data.certifications && data.certifications.length > 0 && (
        <ExecSection title="Professional Certifications">
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              fontSize: "10.5pt",
              color: BODY,
              lineHeight: 1.7,
            }}
          >
            {data.certifications.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </ExecSection>
      )}

      {/* ── LANGUAGES ───────────────────────────────────────────────── */}
      {data.languages && data.languages.length > 0 && (
        <ExecSection title="Languages">
          <div style={{ fontSize: "10.5pt", color: BODY }}>{data.languages.join(" · ")}</div>
        </ExecSection>
      )}

      {/* ── BOTTOM RULE ─────────────────────────────────────────────── */}
      <div style={{ height: "3px", background: DARK, marginTop: "20px" }} />
    </div>
  );
}

function ExecSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2
        style={{
          fontSize: "11pt",
          fontWeight: "bold",
          color: DARK,
          textTransform: "uppercase",
          fontVariant: "small-caps",
          letterSpacing: "0.1em",
          margin: "0 0 4px",
          borderBottom: `1px solid ${DARK}`,
          paddingBottom: "3px",
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: "10px" }}>{children}</div>
    </div>
  );
}
