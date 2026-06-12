"use client";

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
}

export default function CreativeTemplate({ resumeText, targetRole, parsedData }: Props) {
  const data = parsedData || parseResume(resumeText);

  return (
    <div style={{
      fontFamily: "'Instrument Sans', -apple-system, sans-serif",
      maxWidth: "800px",
      margin: "0 auto",
      padding: "56px 44px 56px 56px",
      background: "#ffffff",
      color: "#2d3748",
      lineHeight: 1.6,
      position: "relative",
      fontSize: "10pt",
    }}>
      {/* Decorative vertical accent bar */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "10px",
        height: "100%",
        background: "linear-gradient(180deg, #6366f1 0%, #a855f7 100%)",
      }} />

      {/* Header */}
      <div style={{ 
        marginBottom: "36px",
        paddingBottom: "20px",
        borderBottom: "3px solid #6366f1",
      }}>
        <h1 style={{ 
          fontSize: "28px", 
          fontWeight: 800, 
          color: "#1e1b4b",
          margin: "0 0 6px 0",
          letterSpacing: "-0.5px"
        }}>
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div style={{ 
            fontSize: "14px", 
            color: "#8b5cf6", 
            fontWeight: "600",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            {targetRole}
          </div>
        )}
        <div style={{ fontSize: "12px", color: "#4f46e5", fontWeight: 500, marginTop: "6px" }}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.email ? "  |  " : ""}{data.contact.phone}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ 
            fontSize: "14px", 
            fontWeight: "bold",
            color: "#6366f1",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7" }} />
            About Me
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#4a5568", lineHeight: 1.65 }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ 
            fontSize: "14px", 
            fontWeight: "bold",
            color: "#6366f1",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7" }} />
            Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "24px", paddingLeft: "12px", borderLeft: "2px solid #f3e8ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#1e1b4b" }}>{exp.title}</span>
                  {exp.company && <span style={{ color: "#6b7280" }}> @ <span style={{ color: "#8b5cf6", fontWeight: 600 }}>{exp.company}</span></span>}
                </div>
                {exp.dates && <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: 600 }}>{exp.dates}</span>}
              </div>
              {exp.bullets.length > 0 && (
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "14px", listStyle: "none" }}>
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} style={{ position: "relative", paddingLeft: "12px", marginBottom: "6px", fontSize: "12.5px", color: "#4a5568", lineHeight: 1.6 }}>
                      <span style={{ position: "absolute", left: 0, color: "#a855f7" }}>✦</span>
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
            fontSize: "14px", 
            fontWeight: "bold",
            color: "#6366f1",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7" }} />
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "18px", paddingLeft: "12px", borderLeft: "2px solid #f3e8ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: "13px" }}>{edu.degree}</div>
                  <div style={{ color: "#8b5cf6", fontWeight: 500, fontSize: "12px" }}>{edu.school}</div>
                </div>
                {edu.dates && <span style={{ color: "#6366f1", fontSize: "11px", fontWeight: 600 }}>{edu.dates}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ 
            fontSize: "14px", 
            fontWeight: "bold",
            color: "#6366f1",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7" }} />
            Skills & Expertise
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {data.skills.map((skill, sIdx) => (
              <span key={sIdx} style={{
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
                borderRadius: "16px",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#4f46e5",
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 style={{ 
            fontSize: "14px", 
            fontWeight: "bold",
            color: "#6366f1",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7" }} />
            Projects
          </h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: "18px", paddingLeft: "12px", borderLeft: "2px solid #f3e8ff" }}>
              <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: "13px" }}>{proj.name}</div>
              <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#4a5568", lineHeight: 1.6 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}