import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { type AnalysisResult } from "@/types";
import { DESIGN_TOKENS } from "@/lib/designTokens";

interface Props {
  result: AnalysisResult;
  targetRole?: string;
  templateId: string;
  jobDescription?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROFESSIONAL / RESULTS TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

const tokens = DESIGN_TOKENS.professional;

const professionalStyles = StyleSheet.create({
  container: {
    fontFamily: tokens.fontFamilyPdf,
    fontSize: 10,
    lineHeight: 1.5,
    color: "#111111",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e6e6e6",
    borderBottomStyle: "solid",
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: tokens.primaryColor,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 6,
  },
  headerRight: {
    textAlign: "right",
  },
  score: {
    fontSize: 34,
    fontWeight: "bold",
  },
  small: {
    fontSize: 11,
    color: "#6b7280",
  },
  section: {
    marginBottom: 18,
  },
  sectionH2: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 8,
    color: tokens.primaryColor,
  },
  sectionP: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5,
  },
  twoCol: {
    flexDirection: "row",
    gap: 28,
    marginBottom: 18,
  },
  col: {
    flex: 1,
  },
  colTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
    color: tokens.primaryColor,
  },
  list: {
    marginTop: 6,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bullet: {
    width: 12,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 10,
    color: "#111111",
  },
  suggestion: {
    marginBottom: 12,
  },
  suggestionHeader: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  suggestionBefore: {
    color: "#cf222e",
    fontSize: 9.5,
  },
  suggestionAfter: {
    color: "#1a7f37",
    fontSize: 9.5,
    marginTop: 2,
  },
  footer: {
    marginTop: 26,
    fontSize: 11,
    color: "#6b7280",
  },
});

function ProfessionalReviewPdf({ result, targetRole, jobDescription }: Omit<Props, "templateId">) {
  const scoreColor =
    result.score >= 75
      ? "#115e59"
      : result.score >= 55
      ? "#92400e"
      : "#7a2020";

  return (
    <View style={professionalStyles.container}>
      <View style={professionalStyles.header}>
        <View style={professionalStyles.headerLeft}>
          <Text style={professionalStyles.title}>{targetRole || "Resume Review"}</Text>
          <Text style={professionalStyles.subtitle}>
            {jobDescription ? "Tailored to job description" : "General review"}
          </Text>
        </View>
        <View style={professionalStyles.headerRight}>
          <Text style={{ ...professionalStyles.score, color: scoreColor }}>{result.score}</Text>
          <Text style={professionalStyles.small}>Overall Score</Text>
        </View>
      </View>

      <View style={professionalStyles.section} wrap={false}>
        <Text style={professionalStyles.sectionH2}>Summary</Text>
        <Text style={professionalStyles.sectionP}>{result.summary}</Text>
      </View>

      <View style={professionalStyles.twoCol} wrap={false}>
        <View style={professionalStyles.col}>
          <Text style={professionalStyles.colTitle}>Strengths</Text>
          <View style={professionalStyles.list}>
            {(result.strengths || []).map((s, i) => (
              <View key={i} style={professionalStyles.listItem}>
                <Text style={professionalStyles.bullet}>+</Text>
                <Text style={professionalStyles.listText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={professionalStyles.col}>
          <Text style={professionalStyles.colTitle}>Areas to Improve</Text>
          <View style={professionalStyles.list}>
            {(result.weaknesses || []).map((w, i) => (
              <View key={i} style={professionalStyles.listItem}>
                <Text style={{ ...professionalStyles.bullet, color: "#7a2020" }}>-</Text>
                <Text style={professionalStyles.listText}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={professionalStyles.section}>
        <Text style={professionalStyles.sectionH2}>Top Suggestions</Text>
        <View>
          {(result.suggestions || []).slice(0, 6).map((s, i) => (
            <View key={i} style={professionalStyles.suggestion} wrap={false}>
              <Text style={professionalStyles.suggestionHeader}>{s.section}</Text>
              <Text style={professionalStyles.suggestionBefore}>
                <Text style={{ fontWeight: "bold" }}>Before: </Text>{s.before}
              </Text>
              <Text style={professionalStyles.suggestionAfter}>
                <Text style={{ fontWeight: "bold" }}>After: </Text>{s.after}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={professionalStyles.footer}>Generated by ResumeLens</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MODERN TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

const modernStyles = StyleSheet.create({
  container: {
    fontFamily: "Inter",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#0b1220",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    borderBottomStyle: "solid",
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  headerRight: {
    textAlign: "right",
  },
  score: {
    fontSize: 26,
    fontWeight: "bold",
  },
  small: {
    fontSize: 11,
    color: "#9ca3af",
  },
  grid: {
    flexDirection: "row",
    gap: 18,
  },
  main: {
    flex: 2,
  },
  aside: {
    flex: 1,
    backgroundColor: "#fbfdff",
    borderWidth: 1,
    borderColor: "#eef2ff",
    borderStyle: "solid",
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 10,
    color: "#111827",
    marginBottom: 16,
  },
  suggestion: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    borderBottomStyle: "dashed",
  },
  suggestionHeader: {
    fontWeight: "bold",
    fontSize: 10,
  },
  suggestionAfter: {
    fontSize: 9.5,
    color: "#374151",
    marginTop: 4,
  },
  asideTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 8,
  },
  asideTitleFirst: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 0,
    marginBottom: 8,
  },
  list: {
    marginTop: 4,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 9.5,
    color: "#0b1220",
  },
  footer: {
    marginTop: 26,
    fontSize: 11,
    color: "#9ca3af",
  },
});

function ModernReviewPdf({ result, targetRole, jobDescription }: Omit<Props, "templateId">) {
  const scoreColor =
    result.score >= 75
      ? "#047857"
      : result.score >= 55
      ? "#92400e"
      : "#7a2020";

  return (
    <View style={modernStyles.container}>
      <View style={modernStyles.header}>
        <View style={modernStyles.headerLeft}>
          <Text style={modernStyles.title}>{targetRole || "Resume Review"}</Text>
          <Text style={modernStyles.subtitle}>
            {jobDescription ? "Tailored to job description" : "General review"}
          </Text>
        </View>
        <View style={modernStyles.headerRight}>
          <Text style={{ ...modernStyles.score, color: scoreColor }}>{result.score}</Text>
          <Text style={modernStyles.small}>Overall Score</Text>
        </View>
      </View>

      <View style={modernStyles.grid}>
        <View style={modernStyles.main}>
          <View style={modernStyles.section} wrap={false}>
            <Text style={modernStyles.sectionTitle}>Summary</Text>
            <Text style={modernStyles.summaryText}>{result.summary}</Text>
          </View>

          <View style={modernStyles.section}>
            <Text style={{ ...modernStyles.sectionTitle, marginTop: 12 }}>Suggestions</Text>
            {(result.suggestions || []).slice(0, 6).map((s, i) => (
              <View key={i} style={modernStyles.suggestion} wrap={false}>
                <Text style={modernStyles.suggestionHeader}>{s.section}</Text>
                <Text style={modernStyles.suggestionAfter}>
                  <Text style={{ fontWeight: "bold" }}>After: </Text>{s.after}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={modernStyles.aside} wrap={false}>
          <Text style={modernStyles.asideTitleFirst}>Strengths</Text>
          <View style={modernStyles.list}>
            {(result.strengths || []).map((s, i) => (
              <View key={i} style={modernStyles.listItem}>
                <Text style={modernStyles.bullet}>•</Text>
                <Text style={modernStyles.listText}>{s}</Text>
              </View>
            ))}
          </View>

          <Text style={modernStyles.asideTitle}>Weaknesses</Text>
          <View style={modernStyles.list}>
            {(result.weaknesses || []).map((w, i) => (
              <View key={i} style={modernStyles.listItem}>
                <Text style={modernStyles.bullet}>•</Text>
                <Text style={modernStyles.listText}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={modernStyles.footer}>
        Generated by ResumeLens | {new Date().getFullYear()}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MINIMAL TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

const minimalStyles = StyleSheet.create({
  container: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#111111",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  score: {
    fontSize: 20,
    fontWeight: "bold",
  },
  summaryText: {
    fontSize: 11,
    color: "#374151",
    marginBottom: 16,
  },
  columns: {
    flexDirection: "row",
    gap: 20,
  },
  leftCol: {
    flex: 1.3,
  },
  rightCol: {
    flex: 1,
  },
  colTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
  },
  list: {
    marginTop: 4,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 9.5,
    color: "#374151",
  },
  footer: {
    marginTop: 26,
    fontSize: 11,
    color: "#6b7280",
  },
});

function MinimalReviewPdf({ result, targetRole }: Omit<Props, "templateId">) {
  const scoreColor = result.score >= 75 ? "#0f766e" : "#7a2020";

  return (
    <View style={minimalStyles.container}>
      <View style={minimalStyles.header}>
        <Text style={minimalStyles.title}>{targetRole || "Resume Review"}</Text>
        <Text style={{ ...minimalStyles.score, color: scoreColor }}>{result.score}</Text>
      </View>

      <Text style={minimalStyles.summaryText}>{result.summary}</Text>

      <View style={minimalStyles.columns}>
        <View style={minimalStyles.leftCol}>
          <Text style={minimalStyles.colTitle}>Suggestions</Text>
          <View style={minimalStyles.list}>
            {(result.suggestions || []).slice(0, 4).map((s, i) => (
              <View key={i} style={minimalStyles.listItem} wrap={false}>
                <Text style={minimalStyles.bullet}>-</Text>
                <Text style={minimalStyles.listText}>{s.after}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={minimalStyles.rightCol} wrap={false}>
          <Text style={minimalStyles.colTitle}>Highlights</Text>
          <View style={minimalStyles.list}>
            {(result.strengths || []).map((s, i) => (
              <View key={i} style={minimalStyles.listItem}>
                <Text style={minimalStyles.bullet}>-</Text>
                <Text style={minimalStyles.listText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={minimalStyles.footer}>ResumeLens</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CREATIVE TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

const creativeStyles = StyleSheet.create({
  container: {
    fontFamily: "Inter",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#0b1220",
  },
  header: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  badge: {
    width: 50,
    height: 50,
    backgroundColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#c2410c",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#7c2d12",
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    gap: 16,
  },
  main: {
    flex: 1.8,
  },
  aside: {
    flex: 1,
    backgroundColor: "#fff7ed",
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 10,
    color: "#0b1220",
    marginBottom: 16,
  },
  suggestion: {
    marginBottom: 10,
  },
  suggestionHeader: {
    fontWeight: "bold",
    fontSize: 10,
  },
  suggestionAfter: {
    fontSize: 9.5,
    color: "#4b2e2e",
    marginTop: 2,
  },
  asideTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
  },
  asideTitleFirst: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 0,
    marginBottom: 8,
  },
  list: {
    marginTop: 4,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 9.5,
    color: "#0b1220",
  },
  footer: {
    marginTop: 26,
    fontSize: 11,
    color: "#6b7280",
  },
});

function CreativeReviewPdf({ result, targetRole, jobDescription }: Omit<Props, "templateId">) {
  return (
    <View style={creativeStyles.container}>
      <View style={creativeStyles.header}>
        <View style={creativeStyles.badge}>
          <Text style={creativeStyles.badgeText}>{result.score}</Text>
        </View>
        <View style={creativeStyles.headerInfo}>
          <Text style={creativeStyles.title}>{targetRole || "Resume Review"}</Text>
          <Text style={creativeStyles.subtitle}>
            {jobDescription ? "Tailored to the role" : "General"}
          </Text>
        </View>
      </View>

      <View style={creativeStyles.grid}>
        <View style={creativeStyles.main}>
          <View style={creativeStyles.section} wrap={false}>
            <Text style={creativeStyles.sectionTitle}>Summary</Text>
            <Text style={creativeStyles.summaryText}>{result.summary}</Text>
          </View>

          <View style={creativeStyles.section}>
            <Text style={creativeStyles.sectionTitle}>Key Rewrites</Text>
            {(result.suggestions || []).slice(0, 4).map((s, i) => (
              <View key={i} style={creativeStyles.suggestion} wrap={false}>
                <Text style={creativeStyles.suggestionHeader}>{s.section}</Text>
                <Text style={creativeStyles.suggestionAfter}>{s.after}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={creativeStyles.aside} wrap={false}>
          <Text style={creativeStyles.asideTitleFirst}>Strengths</Text>
          <View style={creativeStyles.list}>
            {(result.strengths || []).map((s, i) => (
              <View key={i} style={creativeStyles.listItem}>
                <Text style={creativeStyles.bullet}>-</Text>
                <Text style={creativeStyles.listText}>{s}</Text>
              </View>
            ))}
          </View>

          <Text style={creativeStyles.asideTitle}>Weaknesses</Text>
          <View style={creativeStyles.list}>
            {(result.weaknesses || []).map((w, i) => (
              <View key={i} style={creativeStyles.listItem}>
                <Text style={creativeStyles.bullet}>-</Text>
                <Text style={creativeStyles.listText}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={creativeStyles.footer}>
        Creative template — Generated by ResumeLens
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. EXECUTIVE TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

const executiveStyles = StyleSheet.create({
  container: {
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.45,
    color: "#111827",
  },
  header: {
    textAlign: "center",
    marginBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: "#111827",
    borderBottomStyle: "solid",
    paddingBottom: 18,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#7a1c1c",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: "#4b5563",
    fontStyle: "italic",
    marginBottom: 8,
  },
  scoreBlock: {
    alignItems: "center",
    marginTop: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#7a1c1c",
  },
  scoreLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#6b7280",
    letterSpacing: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    borderBottomStyle: "solid",
    paddingBottom: 2,
    marginBottom: 10,
    letterSpacing: 1,
  },
  summaryText: {
    fontSize: 11,
    color: "#1f2937",
    textAlign: "justify",
  },
  twoCol: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
  },
  col: {
    flex: 1,
  },
  colTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    borderBottomStyle: "solid",
    paddingBottom: 2,
    marginBottom: 10,
    letterSpacing: 1,
  },
  list: {
    marginTop: 4,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 10.5,
    color: "#1f2937",
  },
  suggestion: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
    paddingBottom: 10,
  },
  suggestionTitle: {
    fontWeight: "bold",
    fontSize: 10.5,
    color: "#111827",
  },
  suggestionBefore: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  suggestionAfter: {
    fontSize: 10,
    color: "#7a1c1c",
    fontWeight: "bold",
    marginTop: 2,
  },
  footer: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    paddingTop: 8,
    fontSize: 8,
    textTransform: "uppercase",
    color: "#9ca3af",
    letterSpacing: 0.5,
  },
});

function ExecutiveReviewPdf({ result, targetRole, jobDescription }: Omit<Props, "templateId">) {
  return (
    <View style={executiveStyles.container}>
      <View style={executiveStyles.header}>
        <Text style={executiveStyles.title}>
          {targetRole || "Resume Analysis"}
        </Text>
        <Text style={executiveStyles.subtitle}>
          {jobDescription ? "Evaluation against Job Description" : "General Resume Evaluation"}
        </Text>
        <View style={executiveStyles.scoreBlock}>
          <Text style={executiveStyles.score}>{result.score} / 100</Text>
          <Text style={executiveStyles.scoreLabel}>Overall Score</Text>
        </View>
      </View>

      <View style={executiveStyles.section} wrap={false}>
        <Text style={executiveStyles.sectionTitle}>Executive Summary</Text>
        <Text style={executiveStyles.summaryText}>{result.summary}</Text>
      </View>

      <View style={executiveStyles.twoCol} wrap={false}>
        <View style={executiveStyles.col}>
          <Text style={executiveStyles.colTitle}>Key Strengths</Text>
          <View style={executiveStyles.list}>
            {(result.strengths || []).map((s, i) => (
              <View key={i} style={executiveStyles.listItem}>
                <Text style={executiveStyles.bullet}>-</Text>
                <Text style={executiveStyles.listText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={executiveStyles.col}>
          <Text style={executiveStyles.colTitle}>Areas to Improve</Text>
          <View style={executiveStyles.list}>
            {(result.weaknesses || []).map((w, i) => (
              <View key={i} style={executiveStyles.listItem}>
                <Text style={executiveStyles.bullet}>-</Text>
                <Text style={executiveStyles.listText}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={executiveStyles.section}>
        <Text style={executiveStyles.sectionTitle}>Actionable Suggestions</Text>
        <View>
          {(result.suggestions || []).slice(0, 5).map((s, i) => (
            <View key={i} style={executiveStyles.suggestion} wrap={false}>
              <Text style={executiveStyles.suggestionTitle}>{s.section}</Text>
              <Text style={executiveStyles.suggestionBefore}>
                <Text style={{ fontWeight: "bold" }}>Original: </Text>{s.before}
              </Text>
              <Text style={executiveStyles.suggestionAfter}>
                <Text style={{ fontWeight: "bold" }}>Recommendation: </Text>{s.after}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={executiveStyles.footer}>
            Generated by ResumeLens | Seniority/Executive Audit Report
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

export default function ResumeReviewPdfTemplate({
  result,
  targetRole,
  templateId,
  jobDescription,
}: Props) {
  const props = { result, targetRole, jobDescription };

  switch (templateId) {
    case "modern":
      return <ModernReviewPdf {...props} />;
    case "minimal":
      return <MinimalReviewPdf {...props} />;
    case "creative":
      return <CreativeReviewPdf {...props} />;
    case "executive":
      return <ExecutiveReviewPdf {...props} />;
    case "professional":
    case "classic":
    case "results":
    default:
      return <ProfessionalReviewPdf {...props} />;
  }
}

