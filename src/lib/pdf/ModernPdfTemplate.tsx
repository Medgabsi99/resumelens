import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { type ParsedResume } from "@/lib/parseResume";
import { DESIGN_TOKENS } from "@/lib/designTokens";

const styles = StyleSheet.create({
  container: {
    fontFamily: "Inter",
    fontSize: 9.5,
    lineHeight: 1.5,
    flexDirection: "row",
    flex: 1,
  },
  sidebar: {
    width: 160,
    backgroundColor: "#f8fafc",
    paddingRight: 10,
    marginRight: 14,
    display: "flex",
    flexDirection: "column",
  },
  main: {
    flex: 1,
  },
  sidebarSection: {
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sidebarItem: {
    fontSize: 8.5,
    color: "#334155",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
  },
  sidebarLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 3,
  },
  role: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2563eb", // blue accent
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
    paddingBottom: 3,
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
    color: "#0f172a",
    fontSize: 9.5,
    flex: 1,
    paddingRight: 10,
  },
  entryCompany: {
    fontWeight: "normal",
    color: "#64748b",
  },
  entryDates: {
    color: "#64748b",
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
    color: "#334155",
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
    color: "#0f172a",
    fontSize: 9.5,
  },
  eduSchool: {
    color: "#64748b",
    fontSize: 9,
    marginTop: 1,
  },
  eduDates: {
    color: "#64748b",
    fontSize: 8.5,
    textAlign: "right",
  },
  projectEntry: {
    marginBottom: 10,
  },
  projectTitle: {
    fontWeight: "bold",
    fontSize: 9.5,
    color: "#0f172a",
    marginBottom: 2,
  },
  projectDesc: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.4,
  },
});

interface Props {
  data: ParsedResume;
  targetRole?: string;
}

export default function ModernPdfTemplate({ data, targetRole }: Props) {
  const tokens = DESIGN_TOKENS.modern;
  const containerStyle = [
    styles.container,
    { fontFamily: tokens.fontFamilyPdf, color: tokens.textColor },
  ];

  return (
    <View style={containerStyle}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        {/* Contact section */}
        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarTitle}>CONTACT</Text>
          {data.contact.email && (
            <View style={styles.sidebarItem}>
              <Text style={styles.sidebarLabel}>EMAIL</Text>
              <Text>{data.contact.email}</Text>
            </View>
          )}
          {data.contact.phone && (
            <View style={styles.sidebarItem}>
              <Text style={styles.sidebarLabel}>PHONE</Text>
              <Text>{data.contact.phone}</Text>
            </View>
          )}
          {data.contact.location && (
            <View style={styles.sidebarItem}>
              <Text style={styles.sidebarLabel}>LOCATION</Text>
              <Text>{data.contact.location}</Text>
            </View>
          )}
          {(data.contact.links || []).map((link, i) => (
            <View key={i} style={styles.sidebarItem}>
              <Text style={styles.sidebarLabel}>
                {link.toLowerCase().includes("linkedin")
                  ? "LINKEDIN"
                  : link.toLowerCase().includes("github")
                    ? "GITHUB"
                    : "PORTFOLIO"}
              </Text>
              <Text>{link}</Text>
            </View>
          ))}
        </View>

        {/* Skills section */}
        {data.skills.length > 0 && (
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>SKILLS</Text>
            {data.skills.map((skill, idx) => (
              <Text key={idx} style={styles.sidebarItem}>
                {skill}
              </Text>
            ))}
          </View>
        )}

        {/* Languages section */}
        {data.languages && data.languages.length > 0 && (
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>LANGUAGES</Text>
            {data.languages.map((l, idx) => (
              <Text key={idx} style={styles.sidebarItem}>
                {l}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Main Main Content Column */}
      <View style={styles.main}>
        {/* Header Block */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.name}>{data.contact.name || "Your Name"}</Text>
          {targetRole && <Text style={styles.role}>{targetRole.toUpperCase()}</Text>}
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>SUMMARY</Text>
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

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {data.projects.map((proj, idx) => (
              <View key={idx} style={styles.projectEntry} wrap={false}>
                <Text style={styles.projectTitle}>{proj.name}</Text>
                <Text style={styles.projectDesc}>{proj.description}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
