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
      lineHeight: 1.45,
      fontSize: "11pt",
    }}>
      {/* Centered Name Block */}
      <div style={{ 
        textAlign: "center", 
        marginBottom: "28px",
      }}>
        <h1 style={{ 
          fontSize: "24pt", 
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "#7a1c1c", // Oxblood accent for name only
          margin: "0 0 6px 0"
        }}>
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div style={{ 
            fontSize: "11pt", 
            color: "#4b5563", 
            fontWeight: "bold",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "8px"
          }}>
            {targetRole}
          </div>
        )}
        <div style={{ fontSize: "10pt", color: "#4b5563" }}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.email ? "  |  " : ""}{data.contact.phone}</span>}
          {data.contact.location && <span>{(data.contact.email || data.contact.phone) ? "  |  " : ""}{data.contact.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ 
            fontSize: "11pt", 
            fontWeight: "bold",
            color: "#111827",
            textTransform: "uppercase",
            fontVariant: "small-caps",
            letterSpacing: "1.5px",
            marginBottom: "10px",
            borderBottom: "1px solid #111827",
            paddingBottom: "3px",
          }}>
            Executive Summary
          </h2>
          <p style={{ margin: 0, fontSize: "11pt", color: "#1f2937", textAlign: "justify" }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ 
            fontSize: "11pt", 
            fontWeight: "bold",
            color: "#111827",
            textTransform: "uppercase",
            fontVariant: "small-caps",
            letterSpacing: "1.5px",
            marginBottom: "12px",
            borderBottom: "1px solid #111827",
            paddingBottom: "3px",
          }}>
            Professional History
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "11pt", color: "#111827", marginBottom: "3px" }}>
                <span>
                  {exp.title}{exp.company ? `, ${exp.company}` : ""}
                </span>
                {exp.dates && <span style={{ fontWeight: "normal", fontStyle: "italic", color: "#4b5563", fontSize: "10pt" }}>{exp.dates}</span>}
              </div>
              {exp.bullets.length > 0 && (
                <ul style={{ margin: "4px 0 0 0", paddingLeft: "18px", fontSize: "10.5pt", color: "#1f2937", lineHeight: 1.45 }}>
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
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ 
            fontSize: "11pt", 
            fontWeight: "bold",
            color: "#111827",
            textTransform: "uppercase",
            fontVariant: "small-caps",
            letterSpacing: "1.5px",
            marginBottom: "12px",
            borderBottom: "1px solid #111827",
            paddingBottom: "3px",
          }}>
            Education & Academic Credentials
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", fontSize: "11pt" }}>
              <div>
                <div style={{ fontWeight: "bold", color: "#111827" }}>{edu.degree}</div>
                <div style={{ fontStyle: "italic", color: "#4b5563", fontSize: "10.5pt", marginTop: "1px" }}>{edu.school}</div>
              </div>
              {edu.dates && <span style={{ color: "#4b5563", fontSize: "10pt", fontStyle: "italic" }}>{edu.dates}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ 
            fontSize: "11pt", 
            fontWeight: "bold",
            color: "#111827",
            textTransform: "uppercase",
            fontVariant: "small-caps",
            letterSpacing: "1.5px",
            marginBottom: "8px",
            borderBottom: "1px solid #111827",
            paddingBottom: "3px",
          }}>
            Areas of Expertise
          </h2>
          <div style={{ fontSize: "10.5pt", color: "#1f2937", lineHeight: 1.45 }}>
            {data.skills.join(", ")}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ 
            fontSize: "11pt", 
            fontWeight: "bold",
            color: "#111827",
            textTransform: "uppercase",
            fontVariant: "small-caps",
            letterSpacing: "1.5px",
            marginBottom: "12px",
            borderBottom: "1px solid #111827",
            paddingBottom: "3px",
          }}>
            Key Projects
          </h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: "14px" }}>
              <div style={{ fontWeight: "bold", fontSize: "11pt", color: "#111827" }}>{proj.name}</div>
              <p style={{ margin: "3px 0 0 0", fontSize: "10.5pt", color: "#1f2937", lineHeight: 1.45 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}