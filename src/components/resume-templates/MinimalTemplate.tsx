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
      maxWidth: "800px",
      margin: "0 auto",
      padding: "56px 48px",
      background: "#ffffff",
      color: "#18181b",
      lineHeight: 1.6,
      fontSize: "10.5pt",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <h1 style={{ 
          fontSize: "24pt", 
          fontWeight: 700, 
          letterSpacing: "-0.5px", 
          color: "#09090b",
          margin: "0 0 4px 0"
        }}>
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div style={{ 
            fontSize: "11pt", 
            color: "#71717a", 
            fontWeight: 500,
            marginBottom: "12px"
          }}>
            {targetRole}
          </div>
        )}
        <div style={{ fontSize: "9.5pt", color: "#71717a", fontWeight: 400 }}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.email ? "  |  " : ""}{data.contact.phone}</span>}
          {data.contact.location && <span>{(data.contact.email || data.contact.phone) ? "  |  " : ""}{data.contact.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ 
            fontSize: "10pt", 
            fontWeight: 700, 
            color: "#71717a", 
            textTransform: "uppercase", 
            fontVariant: "small-caps",
            letterSpacing: "0.15em", 
            marginBottom: "12px" 
          }}>
            Profile
          </h2>
          <p style={{ margin: 0, color: "#27272a", fontSize: "10.5pt", lineHeight: 1.65 }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ 
            fontSize: "10pt", 
            fontWeight: 700, 
            color: "#71717a", 
            textTransform: "uppercase", 
            fontVariant: "small-caps",
            letterSpacing: "0.15em", 
            marginBottom: "14px" 
          }}>
            Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <div>
                  <span style={{ fontWeight: 700, color: "#09090b", fontSize: "11pt" }}>{exp.title}</span>
                  {exp.company && <span style={{ color: "#71717a", fontWeight: 400 }}> — {exp.company}</span>}
                </div>
                {exp.dates && <span style={{ color: "#71717a", fontSize: "9.5pt", fontWeight: 400 }}>{exp.dates}</span>}
              </div>
              {exp.bullets.length > 0 && (
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "18px", color: "#27272a", fontSize: "10.5pt", lineHeight: 1.6 }}>
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} style={{ marginBottom: "5px" }}>
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
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ 
            fontSize: "10pt", 
            fontWeight: 700, 
            color: "#71717a", 
            textTransform: "uppercase", 
            fontVariant: "small-caps",
            letterSpacing: "0.15em", 
            marginBottom: "14px" 
          }}>
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#09090b", fontSize: "11pt" }}>{edu.degree}</div>
                <div style={{ color: "#71717a", fontWeight: 400, fontSize: "10pt" }}>{edu.school}</div>
              </div>
              {edu.dates && <span style={{ color: "#71717a", fontSize: "9.5pt", fontWeight: 400 }}>{edu.dates}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ 
            fontSize: "10pt", 
            fontWeight: 700, 
            color: "#71717a", 
            textTransform: "uppercase", 
            fontVariant: "small-caps",
            letterSpacing: "0.15em", 
            marginBottom: "10px" 
          }}>
            Skills
          </h2>
          <div style={{ color: "#27272a", fontSize: "10.5pt", lineHeight: 1.6 }}>
            {data.skills.join(", ")}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 style={{ 
            fontSize: "10pt", 
            fontWeight: 700, 
            color: "#71717a", 
            textTransform: "uppercase", 
            fontVariant: "small-caps",
            letterSpacing: "0.15em", 
            marginBottom: "14px" 
          }}>
            Projects
          </h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: "18px" }}>
              <div style={{ fontWeight: 700, color: "#09090b", fontSize: "11pt" }}>{proj.name}</div>
              <p style={{ margin: "4px 0 0 0", color: "#27272a", fontSize: "10.5pt", lineHeight: 1.6 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}