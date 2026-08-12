"use client";

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

export default function ElegantTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);
  const gold = "#b8860b";
  const goldLight = "#fdf6e3";

  return (
    <div
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        background: "#ffffff",
        color: "#1a1a1a",
        minHeight: "1100px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {/* Elegant top bar */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${gold}, #d4af37, ${gold})` }} />

      {/* Header */}
      <div
        style={{
          padding: "36px 48px 24px",
          textAlign: "center",
          borderBottom: `1px solid #e8e0d0`,
        }}
      >
        <div
          style={{
            fontSize: "10pt",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: gold,
            fontWeight: 400,
            marginBottom: 10,
          }}
        >
          Curriculum Vitae
        </div>
        <h1
          style={{
            fontSize: "26pt",
            fontWeight: 700,
            margin: "0 0 8px 0",
            color: "#1a1a1a",
            letterSpacing: "0.04em",
            fontFamily: "'Georgia', serif",
          }}
        >
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div
            style={{ fontSize: "11pt", color: "#6b5e4a", fontStyle: "italic", marginBottom: 14 }}
          >
            {targetRole}
          </div>
        )}
        {/* Contact row */}
        <div
          style={{
            fontSize: "10pt",
            color: "#6b5e4a",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "4px 16px",
          }}
        >
          {[
            data.contact.email,
            data.contact.phone,
            data.contact.location,
            ...(data.contact.links || []),
          ]
            .filter(Boolean)
            .map((item, i, arr) => (
              <React.Fragment key={i}>
                <span>{item}</span>
                {i < arr.length - 1 && <span style={{ color: gold }}>·</span>}
              </React.Fragment>
            ))}
        </div>
      </div>

      <div style={{ padding: "28px 48px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Summary */}
        {data.summary && (
          <div>
            <h2
              style={{
                fontSize: "10pt",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: gold,
                margin: "0 0 10px 0",
                fontFamily: "'Georgia', serif",
                fontWeight: 700,
              }}
            >
              Profile
            </h2>
            <p
              style={{
                fontSize: "10pt",
                lineHeight: 1.75,
                color: "#374151",
                margin: 0,
                fontStyle: "italic",
                borderLeft: `3px solid ${gold}`,
                paddingLeft: 14,
              }}
            >
              {data.summary}
            </p>
          </div>
        )}

        {/* Gold divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#e8e0d0" }} />
          <div style={{ width: 6, height: 6, background: gold, transform: "rotate(45deg)" }} />
          <div style={{ flex: 1, height: 1, background: "#e8e0d0" }} />
        </div>

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: "10pt",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: gold,
                margin: "0 0 16px 0",
                fontFamily: "'Georgia', serif",
                fontWeight: 700,
              }}
            >
              Professional Experience
            </h2>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "11pt", fontWeight: 700, color: "#111827" }}>
                    {exp.title}
                  </span>
                  <span style={{ fontSize: "10pt", color: gold, fontStyle: "italic" }}>
                    {exp.dates}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "10pt",
                    color: "#6b5e4a",
                    fontStyle: "italic",
                    marginBottom: 6,
                  }}
                >
                  {exp.company}
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 20,
                      fontSize: "10pt",
                      color: "#374151",
                      lineHeight: 1.7,
                    }}
                  >
                    {exp.bullets.map((b: string, j: number) => (
                      <li key={j} style={{ marginBottom: 4, listStyleType: "disc" }}>
                        {b.trim()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Diamond divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#e8e0d0" }} />
          <div style={{ width: 6, height: 6, background: gold, transform: "rotate(45deg)" }} />
          <div style={{ flex: 1, height: 1, background: "#e8e0d0" }} />
        </div>

        {/* Two column: Skills + Education */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div>
              <h2
                style={{
                  fontSize: "10pt",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: gold,
                  margin: "0 0 12px 0",
                  fontFamily: "'Georgia', serif",
                  fontWeight: 700,
                }}
              >
                Core Competencies
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {data.skills.slice(0, 12).map((skill, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "10pt",
                      color: "#374151",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: gold, fontSize: "10pt" }}>◆</span>
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div>
              <h2
                style={{
                  fontSize: "10pt",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: gold,
                  margin: "0 0 12px 0",
                  fontFamily: "'Georgia', serif",
                  fontWeight: 700,
                }}
              >
                Education
              </h2>
              {data.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: "10pt", fontWeight: 700, color: "#111827" }}>
                    {edu.degree}
                  </div>
                  <div style={{ fontSize: "10pt", color: "#6b5e4a", fontStyle: "italic" }}>
                    {edu.school}
                  </div>
                  <div style={{ fontSize: "10pt", color: gold }}>{edu.dates}</div>
                </div>
              ))}

              {/* Certifications inline */}
              {data.certifications && data.certifications.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h2
                    style={{
                      fontSize: "10pt",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: gold,
                      margin: "0 0 8px 0",
                      fontFamily: "'Georgia', serif",
                      fontWeight: 700,
                    }}
                  >
                    Certifications
                  </h2>
                  {data.certifications.map((cert, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "10pt",
                        color: "#374151",
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ color: gold }}>◆</span>
                      {cert}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#e8e0d0" }} />
              <div style={{ width: 6, height: 6, background: gold, transform: "rotate(45deg)" }} />
              <div style={{ flex: 1, height: 1, background: "#e8e0d0" }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "10pt",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: gold,
                  margin: "0 0 12px 0",
                  fontFamily: "'Georgia', serif",
                  fontWeight: 700,
                }}
              >
                Notable Projects
              </h2>
              {data.projects.map((proj, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 12,
                    padding: "10px 14px",
                    background: goldLight,
                    borderLeft: `3px solid ${gold}`,
                    borderRadius: "0 4px 4px 0",
                  }}
                >
                  <div style={{ fontSize: "10pt", fontWeight: 700, color: "#111827" }}>
                    {proj.name}
                  </div>
                  {proj.description && (
                    <div
                      style={{ fontSize: "10pt", color: "#4b5563", marginTop: 4, lineHeight: 1.6 }}
                    >
                      {proj.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom gold bar */}
      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${gold}, #d4af37, ${gold})`,
          marginTop: 20,
        }}
      />
    </div>
  );
}
