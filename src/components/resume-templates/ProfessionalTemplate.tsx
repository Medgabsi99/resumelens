"use client";

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

export default function ProfessionalTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);

  return (
    <div style={{
      fontFamily: "Georgia, 'Times New Roman', serif",
      maxWidth: "800px",
      margin: "0 auto",
      padding: "56px 48px",
      background: "#ffffff",
      color: "#1a1a1a",
      lineHeight: 1.6,
      fontSize: "11pt",
    }}>
      {/* Header / Contact Info */}
      <div style={{ textAlign: "center", marginBottom: "32px", borderBottom: "2px solid #1e3a8a", paddingBottom: "20px" }}>
        <h1 style={{ fontSize: "26pt", fontWeight: "bold", margin: "0 0 6px 0", color: "#1e3a8a" }}>
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div style={{ fontSize: "12pt", color: "#1e3a8a", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>
            {targetRole}
          </div>
        )}
        <div style={{ fontSize: "10pt", color: "#4b5563", marginTop: "6px" }}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.email ? "  |  " : ""}{data.contact.phone}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "12pt", fontWeight: "bold", color: "#1e3a8a", borderBottom: "1px solid #9ca3af", paddingBottom: "4px", marginBottom: "12px", textTransform: "uppercase" }}>
            Professional Summary
          </h2>
          <p style={{ margin: "0 0 8px 0", fontSize: "10.5pt", color: "#374151", textAlign: "justify", lineHeight: 1.65 }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "12pt", fontWeight: "bold", color: "#1e3a8a", borderBottom: "1px solid #9ca3af", paddingBottom: "4px", marginBottom: "14px", textTransform: "uppercase" }}>
            Work Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "10.5pt", color: "#111827", marginBottom: "4px" }}>
                <span>
                  {exp.title}{exp.company ? ` - ${exp.company}` : ""}
                </span>
                {exp.dates && <span style={{ fontWeight: "normal", color: "#4b5563", fontSize: "9.5pt" }}>{exp.dates}</span>}
              </div>
              {exp.bullets.length > 0 && (
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", fontSize: "10pt", color: "#374151", lineHeight: 1.6 }}>
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} style={{ marginBottom: "6px" }}>
                      {bullet}
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
          <h2 style={{ fontSize: "12pt", fontWeight: "bold", color: "#1e3a8a", borderBottom: "1px solid #9ca3af", paddingBottom: "4px", marginBottom: "14px", textTransform: "uppercase" }}>
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", fontSize: "10.5pt" }}>
              <div>
                <div style={{ fontWeight: "bold", color: "#111827" }}>{edu.degree}</div>
                <div style={{ fontStyle: "italic", color: "#4b5563", marginTop: "2px" }}>{edu.school}</div>
              </div>
              {edu.dates && <span style={{ color: "#4b5563", fontSize: "9.5pt" }}>{edu.dates}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "12pt", fontWeight: "bold", color: "#1e3a8a", borderBottom: "1px solid #9ca3af", paddingBottom: "4px", marginBottom: "10px", textTransform: "uppercase" }}>
            Skills
          </h2>
          <div style={{ fontSize: "10pt", color: "#374151", lineHeight: 1.6 }}>
            {data.skills.join(", ")}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "12pt", fontWeight: "bold", color: "#1e3a8a", borderBottom: "1px solid #9ca3af", paddingBottom: "4px", marginBottom: "14px", textTransform: "uppercase" }}>
            Key Projects
          </h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: "bold", fontSize: "10.5pt", color: "#111827" }}>{proj.name}</div>
              <p style={{ margin: "4px 0 0 0", fontSize: "10pt", color: "#374151", lineHeight: 1.6 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}