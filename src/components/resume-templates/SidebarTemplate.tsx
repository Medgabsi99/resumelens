"use client";

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

export default function SidebarTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);
  const accent = "#1e3a5f";
  const accentLight = "#e8f0fe";

  return (
    <div
      style={{
        fontFamily: "'Calibri', 'Arial', sans-serif",
        display: "flex",
        minHeight: "1100px",
        background: "#ffffff",
        color: "#1a1a1a",
      }}
    >
      {/* Left Sidebar */}
      <div
        style={{
          width: "30%",
          background: accent,
          color: "#ffffff",
          padding: "36px 22px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Name & Title */}
        <div>
          <h1
            style={{
              fontSize: "20pt",
              fontWeight: 800,
              margin: "0 0 4px 0",
              lineHeight: 1.2,
              color: "#ffffff",
            }}
          >
            {data.contact.name || "Your Name"}
          </h1>
          {targetRole && (
            <div
              style={{
                fontSize: "9.5pt",
                color: "#93c5fd",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 6,
              }}
            >
              {targetRole}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.2)" }} />

        {/* Contact */}
        <div>
          <div
            style={{
              fontSize: "8.5pt",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#93c5fd",
              marginBottom: 10,
            }}
          >
            Contact
          </div>
          {data.contact.email && (
            <div style={{ fontSize: "9pt", marginBottom: 5, wordBreak: "break-all" }}>
              {data.contact.email}
            </div>
          )}
          {data.contact.phone && (
            <div style={{ fontSize: "9pt", marginBottom: 5 }}>{data.contact.phone}</div>
          )}
          {data.contact.location && (
            <div style={{ fontSize: "9pt", marginBottom: 5 }}>{data.contact.location}</div>
          )}
          {data.contact.links?.map((link, i) => (
            <div key={i} style={{ fontSize: "9pt", marginBottom: 5, wordBreak: "break-all" }}>
              {link}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.2)" }} />

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div>
            <div
              style={{
                fontSize: "9pt",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#93c5fd",
                marginBottom: 10,
              }}
            >
              Skills
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {data.skills.slice(0, 16).map((skill, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: "10pt" }}
                >
                  <span style={{ color: "#93c5fd", flexShrink: 0, marginTop: "2px" }}>▸</span>
                  <span style={{ color: "#e2e8f0", lineHeight: 1.4 }}>{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education in sidebar */}
        {data.education && data.education.length > 0 && (
          <div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 18 }} />
            <div
              style={{
                fontSize: "8.5pt",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#93c5fd",
                marginBottom: 10,
              }}
            >
              Education
            </div>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "9.5pt", fontWeight: 700 }}>{edu.degree}</div>
                <div style={{ fontSize: "9pt", color: "#bfdbfe" }}>{edu.school}</div>
                <div style={{ fontSize: "8.5pt", color: "#93c5fd", marginTop: 2 }}>{edu.dates}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Main Content */}
      <div
        style={{ flex: 1, padding: "36px 32px", display: "flex", flexDirection: "column", gap: 24 }}
      >
        {/* Summary */}
        {data.summary && (
          <div>
            <div
              style={{
                fontSize: "11pt",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: accent,
                borderBottom: `2px solid ${accent}`,
                paddingBottom: 6,
                marginBottom: 10,
              }}
            >
              Professional Summary
            </div>
            <p style={{ fontSize: "10pt", lineHeight: 1.65, color: "#374151", margin: 0 }}>
              {data.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div>
            <div
              style={{
                fontSize: "11pt",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: accent,
                borderBottom: `2px solid ${accent}`,
                paddingBottom: 6,
                marginBottom: 14,
              }}
            >
              Experience
            </div>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 4,
                    marginBottom: 3,
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11pt", fontWeight: 700, color: "#111827" }}>
                      {exp.title}
                    </span>
                    <span
                      style={{ fontSize: "10pt", color: "#6b7280", fontWeight: 500, marginLeft: 8 }}
                    >
                      · {exp.company}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "9pt",
                      color: "#ffffff",
                      background: accent,
                      padding: "2px 10px",
                      borderRadius: 4,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {exp.dates}
                  </span>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul
                    style={{
                      margin: "6px 0 0 0",
                      paddingLeft: 18,
                      fontSize: "9.5pt",
                      color: "#374151",
                      lineHeight: 1.6,
                    }}
                  >
                    {exp.bullets.map((b, j) => (
                      <li key={j} style={{ marginBottom: 3 }}>
                        {b.trim()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div>
            <div
              style={{
                fontSize: "11pt",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: accent,
                borderBottom: `2px solid ${accent}`,
                paddingBottom: 6,
                marginBottom: 14,
              }}
            >
              Projects
            </div>
            {data.projects.map((proj, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  padding: "10px 14px",
                  background: accentLight,
                  borderRadius: 6,
                  borderLeft: `3px solid ${accent}`,
                }}
              >
                <div
                  style={{ fontSize: "10pt", fontWeight: 700, color: "#111827", marginBottom: 3 }}
                >
                  {proj.name}
                </div>
                {proj.description && (
                  <div style={{ fontSize: "9.5pt", color: "#374151", lineHeight: 1.55 }}>
                    {proj.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div>
            <div
              style={{
                fontSize: "11pt",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: accent,
                borderBottom: `2px solid ${accent}`,
                paddingBottom: 6,
                marginBottom: 10,
              }}
            >
              Certifications
            </div>
            {data.certifications.map((cert, i) => (
              <div
                key={i}
                style={{
                  fontSize: "9.5pt",
                  color: "#374151",
                  marginBottom: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: accent,
                    flexShrink: 0,
                  }}
                />
                {cert}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
