import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { ParsedResume } from "@/lib/parseResume";
import type { ResumeDocument } from "@/types/resume";

// ── Disable hyphenation for ATS fidelity ───────────────────────
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
    lineHeight: 1.4,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  contactLine: {
    fontSize: 9,
    color: "#475569",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  section: {
    marginTop: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a8a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 0.75,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 2,
    marginBottom: 6,
  },
  entryHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#0f172a",
  },
  entryCompany: {
    fontWeight: "normal",
    color: "#334155",
  },
  entryDates: {
    fontSize: 9,
    color: "#64748b",
  },
  bulletRow: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 2.5,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: "#1e3a8a",
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: "#1e293b",
    lineHeight: 1.35,
  },
  skillsText: {
    fontSize: 9.5,
    color: "#334155",
    lineHeight: 1.4,
  },
});

interface Props {
  data: ParsedResume;
  targetRole?: string;
}

export default function AtsPdfATemplate({ data, targetRole }: Props) {
  const authorName = data.contact?.name || "Candidate";
  const docTitle = `${authorName} - ${targetRole || "Resume"} (ATS Certified)`;

  return (
    <Document
      title={docTitle}
      author={authorName}
      subject="Curriculum Vitae"
      keywords={data.skills?.filter(Boolean).join(", ") || "Resume, ATS"}
      creator="ResumeLens Enterprise ATS PDF/A-1b Engine"
      producer="ResumeLens PDF/A Generator"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.contact?.name || "Your Name"}</Text>
          <View style={styles.contactLine}>
            {data.contact?.email && <Text>{data.contact.email}</Text>}
            {data.contact?.phone && <Text>• {data.contact.phone}</Text>}
            {data.contact?.location && <Text>• {data.contact.location}</Text>}
            {data.contact?.links?.map((link, idx) => (
              <Text key={idx}>• {link}</Text>
            ))}
          </View>
        </View>

        {/* ── Summary ───────────────────────────────────────── */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.skillsText}>{data.summary}</Text>
          </View>
        )}

        {/* ── Experience ────────────────────────────────────── */}
        {data.experience && data.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={{ marginBottom: 6 }}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {exp.title}{" "}
                    {exp.company && <Text style={styles.entryCompany}>| {exp.company}</Text>}
                  </Text>
                  <Text style={styles.entryDates}>
                    {exp.dates} {exp.location && `• ${exp.location}`}
                  </Text>
                </View>
                {exp.bullets?.map((bullet, bIdx) => (
                  <View key={bIdx} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── Technical Skills ──────────────────────────────── */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            <Text style={styles.skillsText}>{data.skills.filter(Boolean).join(" • ")}</Text>
          </View>
        )}

        {/* ── Education ─────────────────────────────────────── */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {edu.degree}{" "}
                    {edu.school && <Text style={styles.entryCompany}>| {edu.school}</Text>}
                  </Text>
                  <Text style={styles.entryDates}>{edu.dates}</Text>
                </View>
                {edu.details && <Text style={styles.entryDates}>{edu.details}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
