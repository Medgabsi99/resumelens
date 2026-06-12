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
  const initials = data.contact.name
    ? data.contact.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "YN";

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      maxWidth: "800px",
      margin: "0 auto",
      background: "white",
      color: "#1a202c",
      lineHeight: 1.5,
      fontSize: "10.5pt",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    }}>
      {/* ── Blue Gradient Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
        color: "white",
        padding: "36px 44px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: "-40px", right: "-40px",
          width: "120px", height: "120px", borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }} />
        <div style={{
          position: "absolute", bottom: "-30px", left: "40%",
          width: "80px", height: "80px", borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "24px" }}>
          {/* Initials Avatar */}
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            border: "3px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24pt", fontWeight: 800,
            backdropFilter: "blur(10px)",
            letterSpacing: "0.02em",
            flexShrink: 0,
          }}>
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: "22pt", fontWeight: 800, margin: "0 0 4px",
              letterSpacing: "-0.01em", lineHeight: 1.15,
            }}>
              {data.contact.name || "Your Name"}
            </h1>
            {targetRole && (
              <div style={{
                fontSize: "11pt", fontWeight: 500, opacity: 0.9,
                padding: "3px 14px", background: "rgba(255,255,255,0.15)",
                borderRadius: "20px", display: "inline-block",
                marginBottom: "8px",
              }}>
                {targetRole}
              </div>
            )}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "6px", fontSize: "9.5pt" }}>
              {data.contact.email && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ opacity: 0.7 }}>✉</span>
                  <span style={{ wordBreak: "break-all" }}>{data.contact.email}</span>
                </span>
              )}
              {data.contact.phone && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ opacity: 0.7 }}>📱</span>
                  <span>{data.contact.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content (single column) ── */}
      <div style={{ padding: "36px 44px" }}>

        {/* Summary */}
        {data.summary && (
          <div style={{ marginBottom: "28px" }}>
            <SectionHeading>About Me</SectionHeading>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.65 }}>{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <SectionHeading>Experience</SectionHeading>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "22px", position: "relative", paddingLeft: "20px" }}>
                <div style={{
                  position: "absolute", left: 0, top: "6px",
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: "#3b82f6", border: "3px solid white",
                  boxShadow: "0 0 0 2px #3b82f6",
                }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px", flexWrap: "wrap", gap: "6px" }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "11pt", color: "#0f172a" }}>{exp.title}</span>
                    {exp.company && <span style={{ color: "#475569" }}> · <span style={{ color: "#3b82f6", fontWeight: 600 }}>{exp.company}</span></span>}
                  </div>
                  {exp.dates && (
                    <span style={{
                      fontSize: "9pt", color: "#3b82f6", fontWeight: 600,
                      background: "#dbeafe", padding: "2px 8px", borderRadius: "12px",
                      flexShrink: 0,
                    }}>
                      {exp.dates}
                    </span>
                  )}
                </div>
                {exp.bullets.length > 0 && (
                  <ul style={{ margin: "8px 0 0", paddingLeft: "0", listStyle: "none" }}>
                    {exp.bullets.map((b, j) => (
                      <li key={j} style={{
                        position: "relative", paddingLeft: "14px",
                        marginBottom: "6px", color: "#334155", lineHeight: 1.6,
                      }}>
                        <span style={{ position: "absolute", left: 0, color: "#3b82f6", fontWeight: "bold" }}>▸</span>
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
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: "14px", paddingLeft: "20px", position: "relative" }}>
                <div style={{
                  position: "absolute", left: 0, top: "6px",
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: "#3b82f6", border: "3px solid white",
                  boxShadow: "0 0 0 2px #3b82f6",
                }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{edu.degree}</div>
                    <div style={{ color: "#3b82f6", fontWeight: 500, fontSize: "10pt" }}>{edu.school}</div>
                  </div>
                  {edu.dates && <div style={{ color: "#64748b", fontSize: "9.5pt", fontWeight: 500 }}>{edu.dates}</div>}
                </div>
                {edu.details && <div style={{ color: "#64748b", fontSize: "9.5pt", marginTop: "2px" }}>{edu.details}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <SectionHeading>Skills</SectionHeading>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {data.skills.map((skill, i) => (
                <span key={i} style={{
                  background: "#dbeafe",
                  color: "#1e40af",
                  padding: "5px 14px",
                  borderRadius: "6px",
                  fontSize: "9.5pt",
                  fontWeight: 600,
                  borderLeft: "3px solid #3b82f6",
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <SectionHeading>Projects</SectionHeading>
            {data.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: "14px" }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{p.name}</div>
                <div style={{ color: "#475569", fontSize: "10pt", lineHeight: 1.6 }}>{p.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <SectionHeading>Languages</SectionHeading>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {data.languages.map((l, i) => (
                <span key={i} style={{
                  background: "#f0f9ff",
                  color: "#1e40af",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "9.5pt",
                  fontWeight: 500,
                  border: "1px solid #bfdbfe",
                }}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <SectionHeading>Certifications</SectionHeading>
            {data.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: "10pt", marginBottom: "6px", lineHeight: 1.5, color: "#334155", paddingLeft: "14px", position: "relative" }}>
                <span style={{ position: "absolute", left: 0, color: "#3b82f6", fontWeight: "bold" }}>▸</span>
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Awards */}
        {data.awards && data.awards.length > 0 && (
          <div>
            <SectionHeading>Awards &amp; Honors</SectionHeading>
            {data.awards.map((a, i) => (
              <div key={i} style={{ fontSize: "10pt", marginBottom: "6px", lineHeight: 1.5, color: "#334155", paddingLeft: "14px", position: "relative" }}>
                <span style={{ position: "absolute", left: 0, color: "#3b82f6", fontWeight: "bold" }}>▸</span>
                {a}
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
      fontSize: "13pt",
      fontWeight: 800,
      color: "#0f172a",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      margin: "0 0 14px",
      paddingBottom: "6px",
      borderBottom: "3px solid #3b82f6",
      display: "inline-block",
    }}>
      {children}
    </h2>
  );
}