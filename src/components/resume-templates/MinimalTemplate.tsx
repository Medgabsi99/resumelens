"use client";

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

export default function MinimalTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);

  return (
    <div style={{
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      maxWidth: "750px",
      margin: "0 auto",
      padding: "56px 48px",
      background: "#ffffff",
      color: "#27272a",
      lineHeight: 1.6,
      fontSize: "10pt",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ 
          fontSize: "24px", 
          fontWeight: 300, 
          letterSpacing: "3px", 
          textTransform: "uppercase", 
          color: "#09090b",
          margin: "0 0 8px 0"
        }}>
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div style={{ 
            fontSize: "12px", 
            color: "#71717a", 
            letterSpacing: "1.5px", 
            textTransform: "uppercase",
            fontWeight: 500,
            marginBottom: "16px"
          }}>
            {targetRole}
          </div>
        )}
        <div style={{ fontSize: "12px", color: "#a1a1aa", fontWeight: 300 }}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.email ? "  •  " : ""}{data.contact.phone}</span>}
        </div>
      </div>

      <div style={{ width: "60px", height: "1px", background: "#e4e4e7", margin: "0 auto 36px" }} />

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "36px" }}>
          <h2 style={{ 
            fontSize: "11px", 
            fontWeight: 600, 
            color: "#71717a", 
            textTransform: "uppercase", 
            letterSpacing: "2px", 
            marginBottom: "12px" 
          }}>
            Profile
          </h2>
          <p style={{ margin: 0, color: "#3f3f46", fontWeight: 300, fontSize: "13px", lineHeight: 1.65 }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: "36px" }}>
          <h2 style={{ 
            fontSize: "11px", 
            fontWeight: 600, 
            color: "#71717a", 
            textTransform: "uppercase", 
            letterSpacing: "2px", 
            marginBottom: "16px" 
          }}>
            Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <div>
                  <span style={{ fontWeight: 500, color: "#09090b", fontSize: "13px" }}>{exp.title}</span>
                  {exp.company && <span style={{ color: "#71717a", fontWeight: 300 }}> at {exp.company}</span>}
                </div>
                {exp.dates && <span style={{ color: "#a1a1aa", fontSize: "11px", fontWeight: 300 }}>{exp.dates}</span>}
              </div>
              {exp.bullets.length > 0 && (
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "16px", color: "#3f3f46", fontWeight: 300, fontSize: "12.5px", lineHeight: 1.6 }}>
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
        <div style={{ marginBottom: "36px" }}>
          <h2 style={{ 
            fontSize: "11px", 
            fontWeight: 600, 
            color: "#71717a", 
            textTransform: "uppercase", 
            letterSpacing: "2px", 
            marginBottom: "16px" 
          }}>
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div style={{ fontWeight: 500, color: "#09090b", fontSize: "13px" }}>{edu.degree}</div>
                <div style={{ color: "#71717a", fontWeight: 300, fontSize: "12px" }}>{edu.school}</div>
              </div>
              {edu.dates && <span style={{ color: "#a1a1aa", fontSize: "11px", fontWeight: 300 }}>{edu.dates}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: "36px" }}>
          <h2 style={{ 
            fontSize: "11px", 
            fontWeight: 600, 
            color: "#71717a", 
            textTransform: "uppercase", 
            letterSpacing: "2px", 
            marginBottom: "10px" 
          }}>
            Skills
          </h2>
          <div style={{ color: "#3f3f46", fontWeight: 300, fontSize: "12.5px", lineHeight: 1.6 }}>
            {data.skills.join("  •  ")}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 style={{ 
            fontSize: "11px", 
            fontWeight: 600, 
            color: "#71717a", 
            textTransform: "uppercase", 
            letterSpacing: "2px", 
            marginBottom: "16px" 
          }}>
            Projects
          </h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: "18px" }}>
              <div style={{ fontWeight: 500, color: "#09090b", fontSize: "13px" }}>{proj.name}</div>
              <p style={{ margin: "4px 0 0 0", color: "#3f3f46", fontWeight: 300, fontSize: "12.5px", lineHeight: 1.6 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}