"use client";

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

export default function ModernTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      maxWidth: "800px",
      margin: "0 auto",
      background: "white",
      color: "#1e293b",
      lineHeight: 1.55,
      fontSize: "10pt",
      display: "flex",
      alignItems: "stretch",
    }}>
      {/* Solid Sidebar (Left) */}
      <div style={{
        width: "240px",
        background: "#f8fafc",
        borderRight: "1px solid #e2e8f0",
        padding: "40px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
      }}>
        {/* Contact Info */}
        <div>
          <h2 style={{
            fontSize: "9pt",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#64748b",
            marginBottom: "12px",
          }}>
            Contact
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "9.5pt", color: "#334155" }}>
            {data.contact.email && (
              <div>
                <span style={{ fontWeight: 600, display: "block", color: "#64748b", fontSize: "8pt", textTransform: "uppercase" }}>Email</span>
                <span style={{ wordBreak: "break-all" }}>{data.contact.email}</span>
              </div>
            )}
            {data.contact.phone && (
              <div>
                <span style={{ fontWeight: 600, display: "block", color: "#64748b", fontSize: "8pt", textTransform: "uppercase" }}>Phone</span>
                <span>{data.contact.phone}</span>
              </div>
            )}
            {data.contact.location && (
              <div>
                <span style={{ fontWeight: 600, display: "block", color: "#64748b", fontSize: "8pt", textTransform: "uppercase" }}>Location</span>
                <span>{data.contact.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {data.skills.length > 0 && (
          <div>
            <h2 style={{
              fontSize: "9pt",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#64748b",
              marginBottom: "12px",
            }}>
              Skills
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "9.5pt", color: "#334155" }}>
              {data.skills.map((skill, idx) => (
                <div key={idx} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                  {skill}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div>
            <h2 style={{
              fontSize: "9pt",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#64748b",
              marginBottom: "12px",
            }}>
              Languages
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "9.5pt", color: "#334155" }}>
              {data.languages.map((l, idx) => (
                <div key={idx} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Column (Right) */}
      <div style={{
        flex: 1,
        padding: "40px 32px",
      }}>
        {/* Name and Title */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "24pt",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 4px 0",
            letterSpacing: "-0.5px",
          }}>
            {data.contact.name || "Your Name"}
          </h1>
          {targetRole && (
            <div style={{
              fontSize: "12pt",
              fontWeight: 600,
              color: "#2563eb", // Accent color
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              {targetRole}
            </div>
          )}
        </div>

        {/* Summary */}
        {data.summary && (
          <div style={{ marginBottom: "28px" }}>
            <SectionHeading>Summary</SectionHeading>
            <p style={{ margin: 0, color: "#334155", fontSize: "10pt", lineHeight: 1.6 }}>
              {data.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <SectionHeading>Experience</SectionHeading>
            {data.experience.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px", flexWrap: "wrap", gap: "6px" }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "11pt", color: "#0f172a" }}>{exp.title}</span>
                    {exp.company && <span style={{ color: "#475569", fontWeight: 500 }}> · {exp.company}</span>}
                  </div>
                  {exp.dates && (
                    <span style={{ fontSize: "9.5pt", color: "#64748b", fontWeight: 500 }}>
                      {exp.dates}
                    </span>
                  )}
                </div>
                {exp.bullets.length > 0 && (
                  <ul style={{ margin: "6px 0 0", paddingLeft: "16px", color: "#334155", fontSize: "10pt", lineHeight: 1.55 }}>
                    {exp.bullets.map((b, j) => (
                      <li key={j} style={{ marginBottom: "4px" }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <SectionHeading>Education</SectionHeading>
            {data.education.map((edu, idx) => (
              <div key={idx} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{edu.degree}</div>
                    <div style={{ color: "#475569", fontSize: "9.5pt" }}>{edu.school}</div>
                  </div>
                  {edu.dates && <div style={{ color: "#64748b", fontSize: "9.5pt" }}>{edu.dates}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <SectionHeading>Projects</SectionHeading>
            {data.projects.map((p, idx) => (
              <div key={idx} style={{ marginBottom: "14px" }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{p.name}</div>
                <div style={{ color: "#334155", fontSize: "9.5pt", marginTop: "2px" }}>{p.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: "11pt",
      fontWeight: 800,
      color: "#0f172a",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      margin: "0 0 12px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}>
      <span style={{ width: "8px", height: "8px", background: "#2563eb", display: "inline-block" }} />
      {children}
    </h2>
  );
}