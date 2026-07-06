import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { type ParsedResume } from "@/lib/parseResume";
import { type ResumeCustomStyle } from "../../components/ResumeEditor/types";
import { DESIGN_TOKENS } from "@/lib/designTokens";

const styles = StyleSheet.create({
  container: {
    color: "#1a1a1a",
    fontFamily: "Lora",
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
    borderBottomStyle: "solid",
    paddingBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 4,
  },
  role: {
    fontSize: 11,
    color: "#1e3a8a",
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  contact: {
    fontSize: 9,
    color: "#4b5563",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a8a",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    borderBottomStyle: "solid",
    paddingBottom: 2,
    marginBottom: 10,
  },
  entry: {
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  entryTitle: {
    fontWeight: "bold",
    color: "#111827",
    fontSize: 10,
    flex: 1,
    paddingRight: 10,
  },
  entryDates: {
    color: "#4b5563",
    fontSize: 9,
    textAlign: "right",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 12,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletDot: {
    width: 8,
    fontSize: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: "#374151",
    lineHeight: 1.45,
  },
  eduEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  eduLeft: {
    flex: 1,
    paddingRight: 10,
  },
  eduDegree: {
    fontWeight: "bold",
    color: "#111827",
    fontSize: 10,
  },
  eduSchool: {
    color: "#4b5563",
    fontSize: 9.5,
    fontStyle: "italic",
    marginTop: 1,
  },
  eduDates: {
    color: "#4b5563",
    fontSize: 9,
    textAlign: "right",
  },
  skillsText: {
    fontSize: 9.5,
    color: "#374151",
    lineHeight: 1.45,
  },
  projectEntry: {
    marginBottom: 10,
  },
  projectTitle: {
    fontWeight: "bold",
    fontSize: 10,
    color: "#111827",
    marginBottom: 2,
  },
  projectDesc: {
    fontSize: 9.5,
    color: "#374151",
    lineHeight: 1.45,
  },
});

interface Props {
  data: ParsedResume;
  targetRole?: string;
  customStyle?: ResumeCustomStyle;
}

export default function ProfessionalPdfTemplate({ data, targetRole, customStyle }: Props) {
  const tokens = DESIGN_TOKENS.professional;
  const style = customStyle || {
    fontFamily: "serif",
    fontSize: tokens.fontSize,
    lineHeight: tokens.lineHeight,
    padding: tokens.padding,
    primaryColor: tokens.primaryColor,
  };

  const resolvedFont = style.fontFamily === "sans" ? "Inter" : style.fontFamily === "mono" ? "Courier" : tokens.fontFamilyPdf;
  
  // Convert pt/em strings to raw numbers for React-PDF StyleSheet overrides
  const resolvedFontSize = parseFloat(style.fontSize) || 10;
  const resolvedLineHeight = parseFloat(style.lineHeight) || 1.5;
  const resolvedColor = style.primaryColor || tokens.primaryColor;

  const containerStyle = [styles.container, { fontFamily: resolvedFont, fontSize: resolvedFontSize, lineHeight: resolvedLineHeight }];
  const headerStyle = [styles.header, { borderBottomColor: resolvedColor }];
  const nameStyle = [styles.name, { color: resolvedColor }];
  const roleStyle = [styles.role, { color: resolvedColor }];
  const sectionTitleStyle = [styles.sectionTitle, { color: resolvedColor }];

  return (
    <View style={containerStyle}>
      {/* Header */}
      <View style={headerStyle}>
        <Text style={nameStyle}>{data.contact.name || "Your Name"}</Text>
        {targetRole && (
          <Text style={roleStyle}>{targetRole.toUpperCase()}</Text>
        )}
        <Text style={styles.contact}>
          {[
            data.contact.email,
            data.contact.phone,
            data.contact.location,
          ]
            .filter(Boolean)
            .join("   |   ")}
        </Text>
      </View>

      {/* Summary */}
      {data.summary && (
        <View style={styles.section} wrap={false}>
          <Text style={sectionTitleStyle}>PROFESSIONAL SUMMARY</Text>
          <Text style={styles.projectDesc}>{data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={sectionTitleStyle}>WORK EXPERIENCE</Text>
          {data.experience.map((exp, idx) => (
            <View key={idx} style={styles.entry} wrap={false}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>
                  {exp.title}
                  {exp.company ? ` - ${exp.company}` : ""}
                </Text>
                {exp.dates && (
                  <Text style={styles.entryDates}>{exp.dates}</Text>
                )}
              </View>
              {exp.bullets.length > 0 && (
                <View style={styles.bulletList}>
                  {exp.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <View style={styles.section}>
          <Text style={sectionTitleStyle}>EDUCATION</Text>
          {data.education.map((edu, idx) => (
            <View key={idx} style={styles.eduEntry} wrap={false}>
              <View style={styles.eduLeft}>
                <Text style={styles.eduDegree}>{edu.degree}</Text>
                <Text style={styles.eduSchool}>{edu.school}</Text>
              </View>
              {edu.dates && <Text style={styles.eduDates}>{edu.dates}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <View style={styles.section} wrap={false}>
          <Text style={sectionTitleStyle}>SKILLS</Text>
          <Text style={styles.skillsText}>{data.skills.join(", ")}</Text>
        </View>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <View style={styles.section}>
          <Text style={sectionTitleStyle}>KEY PROJECTS</Text>
          {data.projects.map((proj, idx) => (
            <View key={idx} style={styles.projectEntry} wrap={false}>
              <Text style={styles.projectTitle}>{proj.name}</Text>
              <Text style={styles.projectDesc}>{proj.description}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
