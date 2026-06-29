"use client";

import React from "react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import { type ResumeCustomStyle } from "../ResumeEditor/types";

interface Props {
  resumeText: string;
  targetRole?: string;
  parsedData?: ParsedResume;
  customStyle?: ResumeCustomStyle;
}

export default function MinimalTemplate({ resumeText, targetRole, parsedData, customStyle }: Props) {
  const data = parsedData || parseResume(resumeText);

  const style = customStyle || {
    fontFamily: "sans",
    fontSize: "10.5pt",
    lineHeight: "1.6",
    padding: "56px 48px",
    primaryColor: "#18181b",
  };

  const getFontFamily = (fam: string) => {
    if (fam === "serif") return "Georgia, 'Times New Roman', serif";
    if (fam === "mono") return "DM Mono, Courier New, Courier, monospace";
    return "'Helvetica Neue', Helvetica, Arial, sans-serif";
  };

  return (
    <div style={{
      fontFamily: getFontFamily(style.fontFamily),
      maxWidth: "800px",
      margin: "0 auto",
      padding: style.padding,
      background: "#ffffff",
      color: "#18181b",
      lineHeight: parseFloat(style.lineHeight),
      fontSize: style.fontSize,
    }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22pt", fontWeight: "300", letterSpacing: "-0.5px", color: style.primaryColor, margin: "0 0 4px 0" }}>
          {data.contact.name || "Your Name"}
        </h1>
        {targetRole && (
          <div style={{ fontSize: "10.5pt", color: "#6b7280", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            {targetRole}
          </div>
        )}
        <div style={{ fontSize: "9pt", color: "#6b7280" }}>
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>{data.contact.email ? "  •  " : ""}{data.contact.phone}</span>}
          {data.contact.location && <span>{(data.contact.email || data.contact.phone) ? "  •  " : ""}{data.contact.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "24px" }}>
          <p style={{ margin: "0", fontSize: "9.5pt", color: "#4b5563", lineHeight: 1.6, textAlign: "justify" }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "9pt", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", color: style.primaryColor, borderBottom: "1px solid #e4e4e7", paddingBottom: "3px", marginBottom: "12px" }}>
            Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5pt", marginBottom: "3px" }}>
                <span style={{ fontWeight: "600", color: "#27272a" }}>
                  {exp.title}{exp.company ? ` — ${exp.company}` : ""}
                </span>
                {exp.dates && <span style={{ color: "#71717a", fontSize: "8.5pt" }}>{exp.dates}</span>}
              </div>
              {exp.bullets.length > 0 && (
                <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px", fontSize: "9pt", color: "#52525b", lineHeight: 1.55 }}>
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
          <h2 style={{ fontSize: "9pt", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", color: style.primaryColor, borderBottom: "1px solid #e4e4e7", paddingBottom: "3px", marginBottom: "12px" }}>
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", fontSize: "9.5pt" }}>
              <div>
                <span style={{ fontWeight: "600", color: "#27272a" }}>{edu.degree}</span>
                <span style={{ color: "#52525b" }}>, {edu.school}</span>
              </div>
              {edu.dates && <span style={{ color: "#71717a", fontSize: "8.5pt" }}>{edu.dates}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "9pt", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", color: style.primaryColor, borderBottom: "1px solid #e4e4e7", paddingBottom: "3px", marginBottom: "10px" }}>
            Skills
          </h2>
          <div style={{ fontSize: "9pt", color: "#52525b", lineHeight: 1.55 }}>
            {data.skills.join("   /   ")}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 style={{ fontSize: "9pt", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", color: style.primaryColor, borderBottom: "1px solid #e4e4e7", paddingBottom: "3px", marginBottom: "12px" }}>
            Projects
          </h2>
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: "12px" }}>
              <div style={{ fontWeight: "600", fontSize: "9.5pt", color: "#27272a", marginBottom: "2px" }}>{proj.name}</div>
              <p style={{ margin: "0", fontSize: "9pt", color: "#52525b", lineHeight: 1.55 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}