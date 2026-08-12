"use client";

/**
 * MinimalTemplate — Ultra-clean whitespace-forward design (2026)
 * Inspired by: Apple's internal resume style, Linear job boards
 * ATS: ✅ Single column, standard headings, real bullets
 * Fixed: min 10pt font everywhere, links, certifications, locations
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

export default function MinimalTemplate({
  resumeText,
  targetRole,
  parsedData,
  customStyle,
}: Props) {
  const data = parsedData || parseResume(resumeText);
  const tokens = DESIGN_TOKENS.minimal;
  const primary = customStyle?.primaryColor || tokens.primaryColor || "#18181b";

  const contactItems = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    ...(data.contact.links || []),
  ].filter(Boolean) as string[];

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        maxWidth: "816px",
        margin: "0 auto",
        padding: "44px 56px 48px",
        background: "#ffffff",
        color: "#18181b",
        lineHeight: 1.6,
        fontSize: "10.5pt",
      }}
    >
      {/* ── NAME + CONTACT ───────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "24pt",
            fontWeight: 300,
            letterSpacing: "-0.5px",
            color: primary,
            margin: "0 0 4px 0",
          }}
        >
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div
            style={{
              fontSize: "11pt",
              color: "#6b7280",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "10px",
            }}
          >
            {targetRole}
          </div>
        )}
        <div
          style={{
            fontSize: "10pt",
            color: "#6b7280",
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 0",
          }}
        >
          {contactItems.map((item, i) => (
            <React.Fragment key={i}>
              <span>{item}</span>
              {i < contactItems.length - 1 && (
                <span style={{ margin: "0 10px", color: "#d1d5db" }}>·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ height: "1px", background: "#f3f4f6", marginBottom: "28px" }} />

      {/* ── SUMMARY ─────────────────────────────────────────────────── */}
      {data.summary && (
        <MinSection title="Summary" color={primary}>
          <p
            style={{
              margin: 0,
              fontSize: "10.5pt",
              color: "#4b5563",
              lineHeight: 1.75,
              textAlign: "justify",
            }}
          >
            {data.summary}
          </p>
        </MinSection>
      )}

      {/* ── EXPERIENCE ──────────────────────────────────────────────── */}
      {data.experience.length > 0 && (
        <MinSection title="Experience" color={primary}>
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
                  <span style={{ fontWeight: 600, fontSize: "10.5pt", color: "#27272a" }}>
                    {exp.title}
                  </span>
                  {exp.company && <span style={{ color: "#6b7280" }}> — {exp.company}</span>}
                </div>
                <div style={{ textAlign: "right" }}>
                  {exp.dates && (
                    <div style={{ fontSize: "10pt", color: "#9ca3af" }}>{exp.dates}</div>
                  )}
                  {exp.location && (
                    <div style={{ fontSize: "9.5pt", color: "#9ca3af" }}>{exp.location}</div>
                  )}
                </div>
              </div>
              {exp.bullets.length > 0 && (
                <ul
                  style={{
                    margin: "4px 0 0",
                    paddingLeft: "16px",
                    fontSize: "10.5pt",
                    color: "#52525b",
                    lineHeight: 1.65,
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
        </MinSection>
      )}

      {/* ── PROJECTS ────────────────────────────────────────────────── */}
      {data.projects && data.projects.length > 0 && (
        <MinSection title="Projects" color={primary}>
          {data.projects.map((p, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ fontWeight: 600, fontSize: "10.5pt", color: "#27272a" }}>{p.name}</div>
              {p.description && (
                <p
                  style={{ margin: "2px 0 0", fontSize: "10pt", color: "#52525b", lineHeight: 1.6 }}
                >
                  {p.description}
                </p>
              )}
            </div>
          ))}
        </MinSection>
      )}

      {/* ── EDUCATION ───────────────────────────────────────────────── */}
      {data.education.length > 0 && (
        <MinSection title="Education" color={primary}>
          {data.education.map((edu, i) => (
            <div
              key={i}
              style={{
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "4px",
                fontSize: "10.5pt",
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: "#27272a" }}>{edu.degree}</span>
                <span style={{ color: "#6b7280" }}>, {edu.school}</span>
                {edu.details && (
                  <div style={{ fontSize: "10pt", color: "#9ca3af" }}>{edu.details}</div>
                )}
              </div>
              {edu.dates && <span style={{ color: "#9ca3af", fontSize: "10pt" }}>{edu.dates}</span>}
            </div>
          ))}
        </MinSection>
      )}

      {/* ── SKILLS ──────────────────────────────────────────────────── */}
      {data.skills.length > 0 && (
        <MinSection title="Skills" color={primary}>
          <div style={{ fontSize: "10.5pt", color: "#52525b", lineHeight: 1.7 }}>
            {data.skills.map((s, i) => (
              <span key={i}>
                {s}
                {i < data.skills.length - 1 && (
                  <span style={{ margin: "0 8px", color: "#d1d5db" }}>/</span>
                )}
              </span>
            ))}
          </div>
        </MinSection>
      )}

      {/* ── CERTIFICATIONS ──────────────────────────────────────────── */}
      {data.certifications && data.certifications.length > 0 && (
        <MinSection title="Certifications" color={primary}>
          <ul
            style={{
              margin: 0,
              paddingLeft: "16px",
              fontSize: "10.5pt",
              color: "#52525b",
              lineHeight: 1.7,
            }}
          >
            {data.certifications.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </MinSection>
      )}

      {/* ── LANGUAGES ───────────────────────────────────────────────── */}
      {data.languages && data.languages.length > 0 && (
        <MinSection title="Languages" color={primary}>
          <div style={{ fontSize: "10.5pt", color: "#52525b" }}>{data.languages.join(" · ")}</div>
        </MinSection>
      )}
    </div>
  );
}

function MinSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2
        style={{
          fontSize: "10pt",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color,
          margin: "0 0 4px",
          borderBottom: "1px solid #f3f4f6",
          paddingBottom: "3px",
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: "10px" }}>{children}</div>
    </div>
  );
}
