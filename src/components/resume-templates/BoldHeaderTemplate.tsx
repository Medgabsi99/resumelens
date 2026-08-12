"use client";

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

export default function BoldHeaderTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        background: "#ffffff",
        color: "#1a1a1a",
        minHeight: "1100px",
      }}
    >
      {/* Bold Color-Block Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #2563eb 100%)",
          padding: "40px 48px 32px",
          color: "#ffffff",
        }}
      >
        <h1
          style={{
            fontSize: "28pt",
            fontWeight: 900,
            margin: "0 0 6px 0",
            letterSpacing: "-0.02em",
            color: "#ffffff",
          }}
        >
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div
            style={{
              fontSize: "12pt",
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              marginBottom: 16,
              letterSpacing: "0.02em",
            }}
          >
            {targetRole}
          </div>
        )}
        {/* Contact Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
          {[
            data.contact.email,
            data.contact.phone,
            data.contact.location,
            ...(data.contact.links || []),
          ]
            .filter(Boolean)
            .map((item, i) => (
              <span
                key={i}
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 20,
                  padding: "3px 12px",
                  fontSize: "10pt",
                  backdropFilter: "blur(4px)",
                  color: "#fff",
                }}
              >
                {item}
              </span>
            ))}
        </div>
      </div>

      <div style={{ padding: "32px 48px", display: "flex", flexDirection: "column", gap: 26 }}>
        {/* Summary */}
        {data.summary && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 4,
                  height: 18,
                  background: "linear-gradient(180deg, #7c3aed, #2563eb)",
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  fontSize: "10.5pt",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#111827",
                }}
              >
                Summary
              </span>
            </div>
            <p style={{ fontSize: "10pt", lineHeight: 1.7, color: "#4b5563", margin: 0 }}>
              {data.summary}
            </p>
          </div>
        )}

        {/* Two-column: Experience + Skills/Education */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}>
          {/* Experience column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {data.experience && data.experience.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 4,
                      height: 18,
                      background: "linear-gradient(180deg, #7c3aed, #2563eb)",
                      borderRadius: 2,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10.5pt",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#111827",
                    }}
                  >
                    Experience
                  </span>
                </div>
                {data.experience.map((exp, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: 20,
                      position: "relative",
                      paddingLeft: 16,
                      borderLeft: "2px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: -5,
                        top: 4,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 4,
                        marginBottom: 2,
                      }}
                    >
                      <div style={{ fontSize: "11pt", fontWeight: 700, color: "#111827" }}>
                        {exp.title}
                      </div>
                      <div
                        style={{
                          fontSize: "10pt",
                          color: "#7c3aed",
                          fontWeight: 600,
                          background: "#f3f0ff",
                          padding: "2px 10px",
                          borderRadius: 4,
                        }}
                      >
                        {exp.dates}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "10pt",
                        color: "#6b7280",
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                    >
                      {exp.company}
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 16,
                          fontSize: "10pt",
                          color: "#374151",
                          lineHeight: 1.65,
                        }}
                      >
                        {exp.bullets.map((b: string, j: number) => (
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
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 4,
                      height: 18,
                      background: "linear-gradient(180deg, #7c3aed, #2563eb)",
                      borderRadius: 2,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10.5pt",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#111827",
                    }}
                  >
                    Projects
                  </span>
                </div>
                {data.projects.map((proj, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: "10pt", fontWeight: 700, color: "#111827" }}>
                      {proj.name}
                    </div>
                    {proj.description && (
                      <div
                        style={{
                          fontSize: "10pt",
                          color: "#4b5563",
                          marginTop: 4,
                          lineHeight: 1.6,
                        }}
                      >
                        {proj.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills + Education column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {data.skills && data.skills.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 4,
                      height: 18,
                      background: "linear-gradient(180deg, #7c3aed, #2563eb)",
                      borderRadius: 2,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10.5pt",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#111827",
                    }}
                  >
                    Skills
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {data.skills.slice(0, 16).map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#f3f0ff",
                        color: "#4c1d95",
                        border: "1px solid #ddd6fe",
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: "10pt",
                        fontWeight: 600,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.education && data.education.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 4,
                      height: 18,
                      background: "linear-gradient(180deg, #7c3aed, #2563eb)",
                      borderRadius: 2,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10.5pt",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#111827",
                    }}
                  >
                    Education
                  </span>
                </div>
                {data.education.map((edu, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: 14,
                      padding: "10px 12px",
                      background: "#f9fafb",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ fontSize: "10pt", fontWeight: 700, color: "#111827" }}>
                      {edu.degree}
                    </div>
                    <div
                      style={{ fontSize: "10pt", color: "#7c3aed", fontWeight: 600, marginTop: 2 }}
                    >
                      {edu.school}
                    </div>
                    <div style={{ fontSize: "10pt", color: "#9ca3af", marginTop: 2 }}>
                      {edu.dates}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.certifications && data.certifications.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 4,
                      height: 18,
                      background: "linear-gradient(180deg, #7c3aed, #2563eb)",
                      borderRadius: 2,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10.5pt",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#111827",
                    }}
                  >
                    Certifications
                  </span>
                </div>
                {data.certifications.map((cert, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "10pt",
                      color: "#374151",
                      marginBottom: 5,
                      paddingLeft: 12,
                      borderLeft: "2px solid #ddd6fe",
                    }}
                  >
                    {cert}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
