"use client";

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import { DESIGN_TOKENS } from "@/lib/designTokens";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

export default function CreativeTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);
  const tokens = DESIGN_TOKENS.creative;

  return (
    <div style={{
      fontFamily: tokens.fontFamily,
      maxWidth: "800px",
      margin: "0 auto",
      padding: tokens.padding,
      background: "#ffffff",
      color: tokens.textColor,
      lineHeight: parseFloat(tokens.lineHeight),
      fontSize: tokens.fontSize,
    }}>
      {/* Header with single thin geometric divider */}
      <div style={{ 
        marginBottom: "28px",
        paddingBottom: "18px",
        borderBottom: `1px solid ${tokens.primaryColor}`, // Single geometric divider
      }}>
        <h1 style={{ 
          fontSize: "26pt", 
          fontWeight: 800, 
          color: "#1e1b4b",
          margin: "0 0 4px 0",
          letterSpacing: "-0.5px"
        }}>
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div style={{ 
            fontSize: "12pt", 
            color: "#4f46e5", 
            fontWeight: "700",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            {targetRole}
          </div>
        )}
        <div style={{ fontSize: "9.5pt", color: "#6b7280", marginTop: "4px" }}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.email ? "  |  " : ""}{data.contact.phone}</span>}
          {data.contact.location && <span>{(data.contact.email || data.contact.phone) ? "  |  " : ""}{data.contact.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ 
            fontSize: "11pt", 
            fontWeight: "700",
            color: "#4f46e5",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            About Me
          </h2>
          <p style={{ margin: 0, fontSize: "10pt", color: "#374151", lineHeight: 1.6 }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ 
            fontSize: "11pt", 
            fontWeight: "700",
            color: "#4f46e5",
            marginBottom: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "11pt", color: "#1e1b4b" }}>{exp.title}</span>
                  {exp.company && <span style={{ color: "#6b7280" }}> — <span style={{ color: "#4f46e5", fontWeight: 600 }}>{exp.company}</span></span>}
                </div>
                {exp.dates && <span style={{ fontSize: "9.5pt", color: "#6b7280", fontWeight: 500 }}>{exp.dates}</span>}
              </div>
              {exp.bullets.length > 0 && (
                <ul style={{ margin: "4px 0 0 0", paddingLeft: "18px", color: "#374151", lineHeight: 1.55 }}>
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} style={{ marginBottom: "4px" }}>
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
          <h2 style={{ 
            fontSize: "11pt", 
            fontWeight: "700",
            color: "#4f46e5",
            marginBottom: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: "11pt" }}>{edu.degree}</div>
                  <div style={{ color: "#6b7280", fontSize: "10pt" }}>{edu.school}</div>
                </div>
                {edu.dates && <span style={{ color: "#6b7280", fontSize: "9.5pt", fontWeight: 500 }}>{edu.dates}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ 
            fontSize: "11pt", 
            fontWeight: "700",
            color: "#4f46e5",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Skills & Expertise
          </h2>
          <div style={{ fontSize: "10pt", color: "#374151", lineHeight: 1.6 }}>
            {data.skills.join(", ")}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 style={{ 
            fontSize: "11pt", 
            fontWeight: "700",
            color: "#4f46e5",
            marginBottom: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Projects
          </h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: "11pt" }}>{proj.name}</div>
              <p style={{ margin: "4px 0 0 0", fontSize: "10pt", color: "#374151", lineHeight: 1.6 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}