"use client";

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

export default function ExecutiveTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);

  return (
    <div style={{
      fontFamily: "'Times New Roman', Times, Georgia, serif",
      maxWidth: "800px",
      margin: "0 auto",
      padding: "56px 48px",
      background: "#ffffff",
      color: "#111827",
      lineHeight: 1.6,
      fontSize: "11pt",
    }}>
      {/* Header with double border */}
      <div style={{ 
        borderBottom: "3px double #111827",
        paddingBottom: "20px",
        marginBottom: "32px",
        textAlign: "center"
      }}>
        <h1 style={{ 
          fontSize: "26px", 
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "#111827",
          margin: "0 0 6px 0"
        }}>
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div style={{ 
            fontSize: "13px", 
            color: "#4b5563", 
            fontStyle: "italic",
            marginBottom: "10px"
          }}>
            {targetRole}
          </div>
        )}
        <div style={{ fontSize: "10.5pt", color: "#4b5563", marginTop: "6px" }}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.email ? "  |  " : ""}{data.contact.phone}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ 
            fontSize: "13px", 
            fontWeight: "bold",
            color: "#111827",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "12px",
            borderBottom: "1px solid #9ca3af",
            paddingBottom: "4px",
          }}>
            Executive Profile
          </h2>
          <p style={{ margin: 0, fontSize: "11pt", color: "#1f2937", textAlign: "justify", lineHeight: 1.65 }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ 
            fontSize: "13px", 
            fontWeight: "bold",
            color: "#111827",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "14px",
            borderBottom: "1px solid #9ca3af",
            paddingBottom: "4px",
          }}>
            Professional Credentials
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "11pt", color: "#111827", marginBottom: "4px" }}>
                <span>
                  {exp.title}{exp.company ? `  —  ${exp.company}` : ""}
                </span>
                {exp.dates && <span style={{ fontWeight: "normal", fontStyle: "italic", color: "#4b5563", fontSize: "10pt" }}>{exp.dates}</span>}
              </div>
              {exp.bullets.length > 0 && (
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", fontSize: "10.5pt", color: "#1f2937", textAlign: "justify", lineHeight: 1.6 }}>
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
          <h2 style={{ 
            fontSize: "13px", 
            fontWeight: "bold",
            color: "#111827",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "14px",
            borderBottom: "1px solid #9ca3af",
            paddingBottom: "4px",
          }}>
            Academic Background
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", fontSize: "11pt" }}>
              <div>
                <div style={{ fontWeight: "bold", color: "#111827" }}>{edu.degree}</div>
                <div style={{ fontStyle: "italic", color: "#4b5563", fontSize: "10.5pt", marginTop: "2px" }}>{edu.school}</div>
              </div>
              {edu.dates && <span style={{ color: "#4b5563", fontSize: "10pt", fontStyle: "italic" }}>{edu.dates}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ 
            fontSize: "13px", 
            fontWeight: "bold",
            color: "#111827",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "10px",
            borderBottom: "1px solid #9ca3af",
            paddingBottom: "4px",
          }}>
            Areas of Expertise
          </h2>
          <div style={{ fontSize: "10.5pt", color: "#1f2937", lineHeight: 1.6, textAlign: "justify" }}>
            {data.skills.join("  |  ")}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ 
            fontSize: "13px", 
            fontWeight: "bold",
            color: "#111827",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "14px",
            borderBottom: "1px solid #9ca3af",
            paddingBottom: "4px",
          }}>
            Selected Projects
          </h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: "bold", fontSize: "11pt", color: "#111827" }}>{proj.name}</div>
              <p style={{ margin: "4px 0 0 0", fontSize: "10.5pt", color: "#1f2937", lineHeight: 1.6 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}