import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { type ParsedResume } from "@/lib/parseResume";
import { type ResumeCustomStyle } from "../../components/ResumeEditor/types";
import { DESIGN_TOKENS } from "@/lib/designTokens";

const styles = StyleSheet.create({
  container: {
    color: "#27272a",
    fontFamily: "Inter",
    fontSize: 9.5,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#09090b",
    marginBottom: 3,
  },
  role: {
    fontSize: 10.5,
    color: "#71717a",
    fontWeight: "bold",
    marginBottom: 8,
  },
  contact: {
    fontSize: 8.5,
    color: "#71717a",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#71717a",
    letterSpacing: 1.5,
    marginBottom: 8,
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
    fontSize: 10,
    fontWeight: "bold",
    color: "#09090b",
    flex: 1,
    paddingRight: 10,
  },
  entryCompany: {
    fontWeight: "normal",
    color: "#71717a",
  },
  entryDates: {
    color: "#71717a",
    fontSize: 8.5,
    textAlign: "right",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 10,
  },
  bulletDot: {
    width: 8,
    fontSize: 8.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: "#27272a",
    lineHeight: 1.4,
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
    color: "#09090b",
    fontSize: 10,
  },
  eduSchool: {
    color: "#71717a",
    fontSize: 9,
    marginTop: 1,
  },
  eduDates: {
    color: "#71717a",
    fontSize: 8.5,
    textAlign: "right",
  },
  skillsText: {
    fontSize: 9,
    color: "#27272a",
    lineHeight: 1.4,
  },
  projectEntry: {
    marginBottom: 8,
  },
  projectTitle: {
    fontWeight: "bold",
    fontSize: 10,
    color: "#09090b",
    marginBottom: 2,
  },
  projectDesc: {
    fontSize: 9,
    color: "#27272a",
    lineHeight: 1.4,
  },
});

interface Props {
  data: ParsedResume;
  targetRole?: string;
  customStyle?: ResumeCustomStyle;
}

export default function MinimalPdfTemplate({ data, targetRole, customStyle }: Props) {
  const tokens = DESIGN_TOKENS.minimal;
  const style = customStyle || {
    fontFamily: "sans",
    fontSize: tokens.fontSize,
    lineHeight: tokens.lineHeight,
    padding: tokens.padding,
    primaryColor: tokens.primaryColor,
  };

  const resolvedFont =
    style.fontFamily === "serif"
      ? "Lora"
      : style.fontFamily === "mono"
        ? "Courier"
        : tokens.fontFamilyPdf;
  const resolvedFontSize = parseFloat(style.fontSize) || 9.5;
  const resolvedLineHeight = parseFloat(style.lineHeight) || 1.4;
  const resolvedColor = style.primaryColor || "#09090b";

  const containerStyle = [
    styles.container,
    { fontFamily: resolvedFont, fontSize: resolvedFontSize, lineHeight: resolvedLineHeight },
  ];
  const nameStyle = [styles.name, { color: resolvedColor }];
  const sectionTitleStyle = [styles.sectionTitle, { color: resolvedColor }];

  return (
    <View style={containerStyle}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={nameStyle}>{data.contact.name || "Your Name"}</Text>
        {targetRole && <Text style={styles.role}>{targetRole.toUpperCase()}</Text>}
        <Text style={styles.contact}>
          {[
            data.contact.email,
            data.contact.phone,
            data.contact.location,
            ...(data.contact.links || []),
          ]
            .filter(Boolean)
            .join("   |   ")}
        </Text>
      </View>

      {/* Summary */}
      {data.summary && (
        <View style={styles.section} wrap={false}>
          <Text style={sectionTitleStyle}>PROFILE</Text>
          <Text style={styles.projectDesc}>{data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={sectionTitleStyle}>EXPERIENCE</Text>
          {data.experience.map((exp, idx) => (
            <View key={idx} style={styles.entry} wrap={false}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>
                  {exp.title}
                  {exp.company && <Text style={styles.entryCompany}> — {exp.company}</Text>}
                </Text>
                {exp.dates && <Text style={styles.entryDates}>{exp.dates}</Text>}
              </View>
              {exp.bullets.length > 0 && (
                <View>
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
          <Text style={sectionTitleStyle}>PROJECTS</Text>
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
