import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { type ParsedResume } from "@/lib/parseResume";

const styles = StyleSheet.create({
  container: {
    color: "#374151",
    fontFamily: "Inter",
    fontSize: 9.5,
    lineHeight: 1.55,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#4f46e5", // Indigo divider
    borderBottomStyle: "solid",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e1b4b",
    marginBottom: 3,
  },
  role: {
    fontSize: 11,
    color: "#4f46e5", // Indigo accent
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  contact: {
    fontSize: 9,
    color: "#6b7280",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#4f46e5", // Indigo section headings
    marginBottom: 10,
    letterSpacing: 0.5,
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
    color: "#1e1b4b",
    flex: 1,
    paddingRight: 10,
  },
  entryCompany: {
    color: "#4f46e5",
    fontWeight: "bold",
  },
  entryDates: {
    color: "#6b7280",
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
    color: "#374151",
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
    color: "#1e1b4b",
    fontSize: 10,
  },
  eduSchool: {
    color: "#6b7280",
    fontSize: 9,
    marginTop: 1,
  },
  eduDates: {
    color: "#6b7280",
    fontSize: 8.5,
    textAlign: "right",
  },
  skillsText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
  },
  projectEntry: {
    marginBottom: 10,
  },
  projectTitle: {
    fontWeight: "bold",
    fontSize: 10,
    color: "#1e1b4b",
    marginBottom: 2,
  },
  projectDesc: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.45,
  },
});

interface Props {
  data: ParsedResume;
  targetRole?: string;
}

export default function CreativePdfTemplate({ data, targetRole }: Props) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.contact.name || "Your Name"}</Text>
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
          <Text style={styles.sectionTitle}>ABOUT ME</Text>
          <Text style={styles.projectDesc}>{data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPERIENCE</Text>
          {data.experience.map((exp, idx) => (
            <View key={idx} style={styles.entry} wrap={false}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>
                  {exp.title}
                  {exp.company && (
                    <Text style={{ fontWeight: "normal", color: "#6b7280" }}>
                      {" — "}
                      <Text style={styles.entryCompany}>{exp.company}</Text>
                    </Text>
                  )}
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
          <Text style={styles.sectionTitle}>EDUCATION</Text>
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
          <Text style={styles.sectionTitle}>SKILLS</Text>
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
