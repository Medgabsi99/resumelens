import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { type ParsedResume } from "@/lib/parseResume";

/**
 * TechProPdfTemplate — @react-pdf/renderer version of TechProTemplate
 * Matches the on-screen preview: dark header, TECHNICAL SKILLS early, ATS-safe single column
 */

const ACCENT = "#1d4ed8";
const DARK = "#0f172a";
const MUTED = "#475569";
const FAINT = "#64748b";

const styles = StyleSheet.create({
  container: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
    lineHeight: 1.55,
  },
  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: DARK,
    padding: "24 36 20 36",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  role: {
    fontSize: 11,
    color: "#93c5fd",
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  contact: {
    fontSize: 9,
    color: "#cbd5e1",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  contactItem: {
    marginRight: 14,
  },
  // ── Body ────────────────────────────────────────────────────────────────
  body: {
    padding: "20 36 32 36",
  },
  section: {
    marginBottom: 18,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginRight: 10,
    whiteSpace: "nowrap",
  },
  sectionRule: {
    flex: 1,
    height: 0.5,
    backgroundColor: "#cbd5e1",
  },
  // ── Experience entries ───────────────────────────────────────────────────
  entry: {
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  entryLeft: {
    flex: 1,
    paddingRight: 8,
  },
  entryTitle: {
    fontWeight: "bold",
    color: DARK,
    fontSize: 10.5,
  },
  entryCompany: {
    color: ACCENT,
    fontWeight: "bold",
    fontSize: 10,
  },
  entryMeta: {
    textAlign: "right",
  },
  entryDates: {
    color: FAINT,
    fontSize: 9,
    fontWeight: "bold",
  },
  entryLocation: {
    color: FAINT,
    fontSize: 8.5,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 10,
  },
  bulletDot: {
    width: 8,
    fontSize: 9,
    color: MUTED,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: MUTED,
    lineHeight: 1.5,
  },
  // ── Skills ───────────────────────────────────────────────────────────────
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillItem: {
    fontSize: 10,
    color: "#1e293b",
    marginRight: 2,
  },
  skillDot: {
    fontSize: 10,
    color: ACCENT,
    fontWeight: "bold",
    marginRight: 2,
  },
  // ── Education ────────────────────────────────────────────────────────────
  eduEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  eduLeft: {
    flex: 1,
    paddingRight: 8,
  },
  eduDegree: {
    fontWeight: "bold",
    color: DARK,
    fontSize: 10.5,
  },
  eduSchool: {
    color: MUTED,
    fontSize: 10,
    fontStyle: "italic",
    marginTop: 1,
  },
  eduDetails: {
    color: FAINT,
    fontSize: 9,
    marginTop: 1,
  },
  eduDates: {
    color: FAINT,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "right",
  },
  // ── Certifications ────────────────────────────────────────────────────────
  certRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-start",
  },
  certArrow: {
    color: ACCENT,
    fontWeight: "bold",
    fontSize: 10,
    marginRight: 6,
    width: 10,
  },
  certText: {
    flex: 1,
    fontSize: 10,
    color: "#1e293b",
    lineHeight: 1.5,
  },
  // ── Footer bar ────────────────────────────────────────────────────────────
  footer: {
    height: 3,
    backgroundColor: ACCENT,
  },
  // ── Generic text ─────────────────────────────────────────────────────────
  genericText: {
    fontSize: 10,
    color: MUTED,
    lineHeight: 1.5,
  },
  projectEntry: {
    marginBottom: 10,
  },
  projectTitle: {
    fontWeight: "bold",
    fontSize: 10.5,
    color: DARK,
    marginBottom: 2,
  },
});

interface Props {
  data: ParsedResume;
  targetRole?: string;
}

export default function TechProPdfTemplate({ data, targetRole }: Props) {
  const contactItems = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    ...(data.contact.links || []),
  ].filter(Boolean) as string[];

  return (
    <View style={styles.container}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.contact.name || "Your Name"}</Text>
        {targetRole && <Text style={styles.role}>{targetRole}</Text>}
        <View style={styles.contact}>
          {contactItems.map((item, i) => (
            <Text key={i} style={styles.contactItem}>
              {item}
            </Text>
          ))}
        </View>
      </View>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      <View style={styles.body}>
        {/* Summary */}
        {data.summary && (
          <View style={styles.section}>
            <SectionHeader title="PROFESSIONAL SUMMARY" />
            <Text style={styles.genericText}>{data.summary}</Text>
          </View>
        )}

        {/* Technical Skills — placed early for keyword density */}
        {data.skills.length > 0 && (
          <View style={styles.section} wrap={false}>
            <SectionHeader title="TECHNICAL SKILLS" />
            <View style={styles.skillsRow}>
              {data.skills.map((skill, i) => (
                <React.Fragment key={i}>
                  <Text style={styles.skillItem}>{skill}</Text>
                  {i < data.skills.length - 1 && <Text style={styles.skillDot}> · </Text>}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Professional Experience */}
        {data.experience.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="PROFESSIONAL EXPERIENCE" />
            {data.experience.map((exp, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryTitle}>
                      {exp.title}
                      {exp.company ? " — " : ""}
                      <Text style={styles.entryCompany}>{exp.company || ""}</Text>
                    </Text>
                  </View>
                  <View style={styles.entryMeta}>
                    {exp.dates && <Text style={styles.entryDates}>{exp.dates}</Text>}
                    {exp.location && <Text style={styles.entryLocation}>{exp.location}</Text>}
                  </View>
                </View>
                {exp.bullets.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.bullets.map((b, j) => (
                      <View key={j} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="TECHNICAL PROJECTS" />
            {data.projects.map((p, i) => (
              <View key={i} style={styles.projectEntry} wrap={false}>
                <Text style={styles.projectTitle}>{p.name}</Text>
                {p.description && <Text style={styles.genericText}>{p.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="EDUCATION" />
            {data.education.map((edu, i) => (
              <View key={i} style={styles.eduEntry} wrap={false}>
                <View style={styles.eduLeft}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  <Text style={styles.eduSchool}>{edu.school}</Text>
                  {edu.details && <Text style={styles.eduDetails}>{edu.details}</Text>}
                </View>
                {edu.dates && <Text style={styles.eduDates}>{edu.dates}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.section} wrap={false}>
            <SectionHeader title="CERTIFICATIONS" />
            {data.certifications.map((cert, i) => (
              <View key={i} style={styles.certRow}>
                <Text style={styles.certArrow}>▸</Text>
                <Text style={styles.certText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <View style={styles.section} wrap={false}>
            <SectionHeader title="LANGUAGES" />
            <Text style={styles.genericText}>{data.languages.join(" · ")}</Text>
          </View>
        )}
      </View>

      {/* ── FOOTER BAR ─────────────────────────────────────────────── */}
      <View style={styles.footer} />
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRule} />
    </View>
  );
}
