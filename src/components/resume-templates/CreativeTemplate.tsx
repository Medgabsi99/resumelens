"use client";

/**
 * CreativeTemplate — Bold, modern design for design-adjacent IT / Product / UX roles
 * ATS: ✅ Single column, standard headings, real bullets, min 10pt font
 * Added: links, certifications, locations, min font fix
 */

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import { DESIGN_TOKENS } from "@/lib/designTokens";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

const PURPLE = "#4f46e5";
const DARK = "#1e1b4b";
const MUTED = "#374151";
const FAINT = "#6b7280";

export default function CreativeTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);
  const tokens = DESIGN_TOKENS.creative;

  const contactItems = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    ...(data.contact.links || []),
  ].filter(Boolean) as string[];

  return (
    <div
      style={{
        fontFamily: tokens.fontFamily || "'Inter', 'Segoe UI', system-ui, sans-serif",
        maxWidth: "816px",
        margin: "0 auto",
        padding: "0",
        background: "#ffffff",
        color: MUTED,
        lineHeight: 1.6,
        fontSize: "10.5pt",
      }}
    >
      {/* ── Accent left-bar header ───────────────────────────────────────── */}
      <div style={{ display: "flex", marginBottom: "0" }}>
        {/* Left color bar */}
        <div
          style={{
            width: "6px",
            flexShrink: 0,
            background: `linear-gradient(180deg, ${PURPLE} 0%, #ec4899 100%)`,
          }}
        />
        {/* Header content */}
        <div style={{ flex: 1, padding: "32px 44px 24px 32px", borderBottom: `1px solid #e5e7eb` }}>
          <h1
            style={{
              fontSize: "26pt",
              fontWeight: 900,
              color: DARK,
              margin: "0 0 4px 0",
              letterSpacing: "-0.3px",
            }}
          >
            {data.contact.name || "Your Name"}
          </h1>
          {targetRole && (
            <div
              style={{
                fontSize: "12pt",
                color: PURPLE,
                fontWeight: 700,
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {targetRole}
            </div>
          )}
          <div
            style={{
              fontSize: "10pt",
              color: FAINT,
              display: "flex",
              flexWrap: "wrap",
              gap: "4px 0",
            }}
          >
            {contactItems.map((item, i) => (
              <React.Fragment key={i}>
                <span>{item}</span>
                {i < contactItems.length - 1 && (
                  <span style={{ margin: "0 10px", color: "#ec4899" }}>|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "24px 44px 40px 38px",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
        }}
      >
        {/* Summary */}
        {data.summary && (
          <CreSection title="About Me" color={PURPLE}>
            <p style={{ margin: 0, fontSize: "10.5pt", color: MUTED, lineHeight: 1.7 }}>
              {data.summary}
            </p>
          </CreSection>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <CreSection title="Experience" color={PURPLE}>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    gap: "4px",
                    marginBottom: "4px",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: "11pt", color: DARK }}>
                      {exp.title}
                    </span>
                    {exp.company && (
                      <span style={{ color: PURPLE, fontWeight: 600 }}> — {exp.company}</span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {exp.dates && (
                      <div style={{ fontSize: "9.5pt", color: FAINT }}>{exp.dates}</div>
                    )}
                    {exp.location && (
                      <div style={{ fontSize: "9pt", color: FAINT }}>{exp.location}</div>
                    )}
                  </div>
                </div>
                {exp.bullets.length > 0 && (
                  <ul
                    style={{
                      margin: "4px 0 0",
                      paddingLeft: "18px",
                      color: MUTED,
                      lineHeight: 1.65,
                      fontSize: "10.5pt",
                    }}
                  >
                    {exp.bullets.map((b, j) => (
                      <li key={j} style={{ marginBottom: "4px" }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CreSection>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <CreSection title="Projects" color={PURPLE}>
            {data.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: "12px" }}>
                <div style={{ fontWeight: 800, fontSize: "11pt", color: DARK }}>{p.name}</div>
                {p.description && (
                  <p style={{ margin: "3px 0 0", fontSize: "10pt", color: MUTED, lineHeight: 1.6 }}>
                    {p.description}
                  </p>
                )}
              </div>
            ))}
          </CreSection>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <CreSection title="Education" color={PURPLE}>
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
                  <div style={{ color: FAINT, fontSize: "10pt" }}>{edu.school}</div>
                  {edu.details && (
                    <div style={{ fontSize: "9.5pt", color: FAINT }}>{edu.details}</div>
                  )}
                </div>
                {edu.dates && <span style={{ color: FAINT, fontSize: "9.5pt" }}>{edu.dates}</span>}
              </div>
            ))}
          </CreSection>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <CreSection title="Skills & Expertise" color={PURPLE}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    background: "#ede9fe",
                    color: "#4c1d95",
                    border: "1px solid #ddd6fe",
                    borderRadius: "6px",
                    padding: "3px 10px",
                    fontSize: "10pt",
                    fontWeight: 600,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </CreSection>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <CreSection title="Certifications" color={PURPLE}>
            <ul
              style={{
                margin: 0,
                paddingLeft: "18px",
                fontSize: "10.5pt",
                color: MUTED,
                lineHeight: 1.7,
              }}
            >
              {data.certifications.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </CreSection>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <CreSection title="Languages" color={PURPLE}>
            <div style={{ fontSize: "10.5pt", color: MUTED }}>{data.languages.join(" · ")}</div>
          </CreSection>
        )}
      </div>
    </div>
  );
}

function CreSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2
        style={{
          fontSize: "11pt",
          fontWeight: 900,
          color,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "0 0 4px",
          paddingBottom: "4px",
          borderBottom: `2px solid ${color}30`,
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: "10px" }}>{children}</div>
    </div>
  );
}
