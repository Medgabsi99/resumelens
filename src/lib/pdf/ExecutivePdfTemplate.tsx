import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { type ParsedResume } from "@/lib/parseResume";
import { DESIGN_TOKENS } from "@/lib/designTokens";

const styles = StyleSheet.create({
  container: {
    color: "#1f2937",
    fontFamily: "Lora",
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#7a1c1c", // Oxblood accent
    marginBottom: 4,
  },
  role: {
    fontSize: 10.5,
    color: "#4b5563",
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
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    borderBottomStyle: "solid",
    paddingBottom: 2,
    marginBottom: 10,
    letterSpacing: 1,
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
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    paddingRight: 10,
  },
  entryDates: {
    color: "#4b5563",
    fontSize: 9,
    fontStyle: "italic",
    textAlign: "right",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 12,
  },
  bulletDot: {
    width: 8,
    fontSize: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: "#1f2937",
    lineHeight: 1.4,
    textAlign: "justify",
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
    fontSize: 10.5,
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
    fontStyle: "italic",
    textAlign: "right",
  },
  skillsText: {
    fontSize: 9.5,
    color: "#1f2937",
    lineHeight: 1.45,
  },
  projectEntry: {
    marginBottom: 10,
  },
  projectTitle: {
    fontWeight: "bold",
    fontSize: 10.5,
    color: "#111827",
    marginBottom: 2,
  },
  projectDesc: {
    fontSize: 9.5,
    color: "#1f2937",
    lineHeight: 1.4,
  },
});

interface Props {
  data: ParsedResume;
  targetRole?: string;
}

export default function ExecutivePdfTemplate({ data, targetRole }: Props) {
  const tokens = DESIGN_TOKENS.executive;
  const containerStyle = [styles.container, { fontFamily: tokens.fontFamilyPdf, color: tokens.textColor }];
  const nameStyle = [styles.name, { color: tokens.primaryColor || "#7a1c1c" }];

  return (
    <View style={containerStyle}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={nameStyle}>{(data.contact.name || "Your Name").toUpperCase()}</Text>
        {targetRole && (
          <Text style={styles.role}>{targetRole.toUpperCase()}</Text>
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
          <Text style={styles.sectionTitle}>EXECUTIVE SUMMARY</Text>
          <Text style={styles.projectDesc}>{data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFESSIONAL HISTORY</Text>
          {data.experience.map((exp, idx) => (
            <View key={idx} style={styles.entry} wrap={false}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>
                  {exp.title}
                  {exp.company ? `, ${exp.company}` : ""}
                </Text>
                {exp.dates && (
                  <Text style={styles.entryDates}>{exp.dates}</Text>
                )}
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
          <Text style={styles.sectionTitle}>EDUCATION & ACADEMIC CREDENTIALS</Text>
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
          <Text style={styles.sectionTitle}>SKILLS & CORE COMPETENCIES</Text>
          <Text style={styles.skillsText}>{data.skills.join(", ")}</Text>
        </View>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KEY PROJECTS</Text>
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
