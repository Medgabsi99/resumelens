/**
 * PlainTextPdfTemplate — ELITE PDF renderer
 *
 * Two-tier rendering strategy:
 * 1. PRIMARY (when structuredResume is available): renders from AI-extracted JSON.
 *    Perfect section detection, dates, bullets — zero regex guessing.
 * 2. FALLBACK (text only): a hardened line-by-line parser used when AI structure
 *    is unavailable (e.g. older cached results). French + English months supported.
 *
 * All styles are inline — no StyleSheet.create — to prevent @react-pdf/renderer
 * layout conflicts. Every element is width-constrained to prevent text overflow.
 */
import React from "react";
import { View, Text, Svg, Line } from "@react-pdf/renderer";
import type { ResumeStyleTokens } from "@/types";
import type { StructuredResume, StructuredSection } from "@/types/structuredResume";
import { DEFAULT_STYLE_TOKENS } from "@/lib/resumeStyleDefaults";
import { sanitizeStructuredResume } from "./pdfSanitizer";

// ─── Font resolution map ──────────────────────────────────────────────────────
const FONT_MAP: Record<string, string> = {
  montserrat: "Montserrat",
  lora: "Lora",
  georgia: "Georgia",
  "playfair display": "Playfair Display",
  merriweather: "Merriweather",
  "eb garamond": "EB Garamond",
  roboto: "Roboto",
  "open sans": "Open Sans",
  "source sans pro": "Source Sans Pro",
  nunito: "Nunito",
  poppins: "Poppins",
  raleway: "Raleway",
  inter: "Inter",
};

// ─── Fallback text-parser helpers ─────────────────────────────────────────────
const SECTION_KW = new Set([
  "profil professionnel",
  "profil",
  "résumé professionnel",
  "profile",
  "summary",
  "objective",
  "about me",
  "about",
  "professional summary",
  "compétences techniques",
  "compétences",
  "compétences clés",
  "skills",
  "technical skills",
  "core competencies",
  "expertise",
  "expérience professionnelle",
  "expérience",
  "expériences",
  "experience",
  "professional experience",
  "work experience",
  "employment",
  "formation",
  "éducation",
  "education",
  "academic background",
  "projets",
  "projects",
  "key projects",
  "personal projects",
  "certifications",
  "licenses",
  "langues",
  "languages",
  "awards",
  "honors",
  "distinctions",
  "bénévolat",
  "volunteer",
  "references",
]);

function isSectionKw(line: string): boolean {
  const t = line.trim().toLowerCase().replace(/:$/, "");
  if (SECTION_KW.has(t)) return true;
  if (t.length > 1 && t.length < 50 && t === t.toUpperCase() && /[A-Z]/.test(t)) return true;
  if (line.trim().endsWith(":") && line.trim().length < 50) return true;
  return false;
}
function isBulletLine(line: string): boolean {
  return /^[\s]*[-•*–○]\s/.test(line);
}
function isDateOnly(line: string): boolean {
  const t = line.trim();
  return (
    /^[\w]{0,12}\s*\d{4}\s*[-–—]\s*([\w]{0,12}\s*\d{4}|present|current|now|présent|actuel)/i.test(
      t
    ) ||
    (/^(?:jan|feb|fév|mar|avr|apr|mai|may|jun|jul|juil|aug|août|sep|oct|nov|déc|dec)/i.test(t) &&
      /\d{4}/.test(t))
  );
}
function isEntryHeader(line: string): boolean {
  const t = line.trim();
  return /[-–—]/.test(t) && !isDateOnly(t) && t.length < 130 && !/^[-•*–○]/.test(t);
}
function isLabelColon(line: string): boolean {
  const t = line.trim();
  return (
    /^[A-ZÀ-Ü][A-Za-zÀ-öø-ÿ &\/]+\s*[:：]\s*.{8,}/.test(t) && !isSectionKw(t) && !isEntryHeader(t)
  );
}
function splitDate(line: string): { title: string; date: string } | null {
  const m = line.match(
    /\s+((?:jan|feb|fév|mar|avr|apr|mai|may|jun|jul|juil|aug|août|sep|oct|nov|déc|dec)\w*\.?\s+)?\d{4}[\s\S]*$/i
  );
  if (m && m.index) return { title: line.slice(0, m.index).trim(), date: m[0].trim() };
  const m2 = line.match(/\s+(\d{4}\s*[-–—]\s*(\d{4}|présent|present|actuel|today))$/i);
  if (m2 && m2.index) return { title: line.slice(0, m2.index).trim(), date: m2[0].trim() };
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  text: string;
  targetRole?: string;
  styleTokens?: ResumeStyleTokens;
  structuredResume?: StructuredResume;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PlainTextPdfTemplate({
  text,
  styleTokens,
  structuredResume: rawStructured,
}: Props) {
  const tok: ResumeStyleTokens = { ...DEFAULT_STYLE_TOKENS, ...styleTokens };
  // ⚡ Auto-repair: sanitize structured data before rendering
  const structuredResume = rawStructured ? sanitizeStructuredResume(rawStructured) : undefined;
  const font = FONT_MAP[(tok.fontFamily || "inter").toLowerCase()] ?? "Inter";
  const bullet = tok.bulletStyle === "dash" ? "–" : tok.bulletStyle === "circle" ? "○" : "•";
  const ink = tok.inkColor || "#1a1a1a";
  const muted = "#4b5563";
  const faint = "#6b7280";
  const accent = tok.accentColor || "#0f766e";

  // ── Shared sub-components ──────────────────────────────────────────────────

  function SectionHeading({ label }: { label: string }) {
    if (tok.sectionStyle === "all-caps-line") {
      return (
        <View style={{ marginTop: 12, marginBottom: 5 }}>
          <Svg height={1} width="100%">
            <Line x1="0" y1="0" x2="1000" y2="0" strokeWidth={0.8} stroke="#9ca3af" />
          </Svg>
          <Text
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: ink,
              fontFamily: font,
              marginTop: 4,
              letterSpacing: 0.8,
            }}
          >
            {label.toUpperCase()}
          </Text>
        </View>
      );
    }
    if (tok.sectionStyle === "colored-box") {
      return (
        <View
          style={{
            marginTop: 12,
            marginBottom: 5,
            backgroundColor: accent,
            paddingTop: 3,
            paddingBottom: 3,
            paddingLeft: 6,
            paddingRight: 6,
            borderRadius: 3,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 700, color: "#ffffff", fontFamily: font }}>
            {label}
          </Text>
        </View>
      );
    }
    if (tok.sectionStyle === "bold-only") {
      return (
        <Text
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: accent,
            fontFamily: font,
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          {label}
        </Text>
      );
    }
    // Default: colored underline
    return (
      <View style={{ marginTop: 12, marginBottom: 5 }}>
        <Text
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: accent,
            fontFamily: font,
            marginBottom: 2,
          }}
        >
          {label}
        </Text>
        <View style={{ height: 1, backgroundColor: accent, opacity: 0.4 }} />
      </View>
    );
  }

  function Bullet({ text: t }: { text: string }) {
    return (
      <View style={{ flexDirection: "row", marginLeft: 10, marginBottom: 2.5, marginTop: 1 }}>
        <Text
          style={{ fontSize: 9, color: accent, marginRight: 5, flexShrink: 0, fontFamily: font }}
        >
          {bullet}
        </Text>
        <Text style={{ fontSize: 9, color: muted, flex: 1, lineHeight: 1.55, fontFamily: font }}>
          {t}
        </Text>
      </View>
    );
  }

  function EntryRow({ title, date }: { title: string; date?: string }) {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginTop: 7,
          marginBottom: 1,
        }}
      >
        <Text
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: ink,
            fontFamily: font,
            flex: 1,
            paddingRight: 10,
          }}
        >
          {title}
        </Text>
        {date ? (
          <Text
            style={{
              fontSize: 8.5,
              color: faint,
              fontFamily: font,
              flexShrink: 0,
              textAlign: "right",
            }}
          >
            {date}
          </Text>
        ) : null}
      </View>
    );
  }

  // ── STRUCTURED path — renders from AI-extracted JSON ──────────────────────
  if (structuredResume) {
    const { contact, sections } = structuredResume;
    const contactParts = [
      contact.email,
      contact.phone,
      contact.location,
      contact.linkedin,
      contact.github,
      contact.portfolio,
      ...(contact.other_links || []),
    ].filter(Boolean) as string[];

    const headerAlign = tok.headerAlignment === "center" ? "center" : "left";
    const nameSize = tok.nameSizeCategory === "large" ? 22 : 17;

    return (
      <View style={{ fontFamily: font }}>
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <Text
          style={{
            fontSize: nameSize,
            fontWeight: 700,
            color: ink,
            fontFamily: font,
            marginBottom: 2,
            textAlign: headerAlign,
          }}
        >
          {contact.name || ""}
        </Text>
        {contact.title && (
          <Text
            style={{
              fontSize: 10,
              color: accent,
              fontFamily: font,
              marginBottom: 3,
              fontWeight: 700,
              textAlign: headerAlign,
            }}
          >
            {contact.title}
          </Text>
        )}
        {/* Contact line — items separated by  |  */}
        {contactParts.length > 0 && (
          <Text
            style={{
              fontSize: 8.5,
              color: faint,
              fontFamily: font,
              marginBottom: 2,
              textAlign: headerAlign,
              lineHeight: 1.5,
            }}
          >
            {contactParts.join("   |   ")}
          </Text>
        )}

        {tok.hasSeparatorLine && (
          <View style={{ marginTop: 8, marginBottom: 10 }}>
            <Svg height={1} width="100%">
              <Line x1="0" y1="0" x2="1000" y2="0" strokeWidth={1} stroke="#d1d5db" />
            </Svg>
          </View>
        )}

        {/* ── SECTIONS ─────────────────────────────────────────────────── */}
        {sections.map((sec, si) => (
          <View key={si}>
            <SectionHeading label={sec.original_heading} />

            {/* SUMMARY */}
            {sec.type === "summary" && sec.summary_text && (
              <Text style={{ fontSize: 9, color: muted, lineHeight: 1.65, fontFamily: font }}>
                {sec.summary_text}
              </Text>
            )}

            {/* EXPERIENCE */}
            {sec.type === "experience" &&
              (sec.experience || []).map((exp, ei) => (
                <View key={ei} style={{ marginBottom: 8 }}>
                  <EntryRow
                    title={
                      exp.company
                        ? `${exp.title} — ${exp.company}${exp.location ? `, ${exp.location}` : ""}`
                        : exp.title
                    }
                    date={exp.dates}
                  />
                  {exp.bullets.map((b, bi) => (
                    <Bullet key={bi} text={b} />
                  ))}
                </View>
              ))}

            {/* EDUCATION */}
            {sec.type === "education" &&
              (sec.education || []).map((edu, ei) => (
                <View key={ei} style={{ marginBottom: 6 }}>
                  <EntryRow
                    title={`${edu.degree}${edu.school ? ` — ${edu.school}` : ""}${edu.location ? `, ${edu.location}` : ""}`}
                    date={edu.dates}
                  />
                  {edu.details && (
                    <Text
                      style={{
                        fontSize: 8.5,
                        color: faint,
                        fontFamily: font,
                        marginLeft: 2,
                        marginTop: 1,
                      }}
                    >
                      {edu.details}
                    </Text>
                  )}
                </View>
              ))}

            {/* SKILLS — categorized */}
            {sec.type === "skills" && sec.skill_categories && sec.skill_categories.length > 0 && (
              <View>
                {sec.skill_categories.map((cat, ci) => (
                  <View
                    key={ci}
                    style={{ flexDirection: "row", marginBottom: 3, flexWrap: "nowrap" }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: ink,
                        fontFamily: font,
                        flexShrink: 0,
                        marginRight: 5,
                        minWidth: 72,
                      }}
                    >
                      {cat.label}:
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
                        color: muted,
                        fontFamily: font,
                        flex: 1,
                        lineHeight: 1.5,
                      }}
                    >
                      {cat.skills.join(", ")}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* SKILLS — flat (no categories) */}
            {sec.type === "skills" &&
              (!sec.skill_categories || sec.skill_categories.length === 0) &&
              sec.skills_flat &&
              sec.skills_flat.length > 0 && (
                <Text style={{ fontSize: 9, color: muted, fontFamily: font, lineHeight: 1.6 }}>
                  {sec.skills_flat.join(" • ")}
                </Text>
              )}

            {/* PROJECTS */}
            {sec.type === "projects" &&
              (sec.projects || []).map((proj, pi) => (
                <View key={pi} style={{ marginBottom: 7 }}>
                  <EntryRow title={proj.name} date={proj.dates} />
                  {proj.tech && (
                    <Text
                      style={{
                        fontSize: 8.5,
                        color: accent,
                        fontFamily: font,
                        marginLeft: 2,
                        marginTop: 1,
                        marginBottom: 2,
                      }}
                    >
                      {proj.tech}
                    </Text>
                  )}
                  {proj.bullets.map((b, bi) => (
                    <Bullet key={bi} text={b} />
                  ))}
                </View>
              ))}

            {/* CERTIFICATIONS */}
            {sec.type === "certifications" &&
              (sec.certifications || []).map((cert, ci) => (
                <View
                  key={ci}
                  style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}
                >
                  <Text
                    style={{ fontSize: 9, color: ink, fontFamily: font, flex: 1, fontWeight: 700 }}
                  >
                    {cert.name}
                    {cert.issuer ? ` — ${cert.issuer}` : ""}
                  </Text>
                  {cert.date && (
                    <Text style={{ fontSize: 8.5, color: faint, fontFamily: font, flexShrink: 0 }}>
                      {cert.date}
                    </Text>
                  )}
                </View>
              ))}

            {/* LANGUAGES */}
            {sec.type === "languages" && (
              <Text style={{ fontSize: 9, color: muted, fontFamily: font, lineHeight: 1.7 }}>
                {(sec.languages || []).join("   ·   ")}
              </Text>
            )}

            {/* AWARDS */}
            {sec.type === "awards" &&
              (sec.awards || []).map((a, ai) => (
                <Text
                  key={ai}
                  style={{ fontSize: 9, color: muted, fontFamily: font, marginBottom: 2 }}
                >
                  {bullet} {a}
                </Text>
              ))}

            {/* OTHER / FALLBACK */}
            {sec.type === "other" && sec.other_text && (
              <Text style={{ fontSize: 9, color: muted, fontFamily: font, lineHeight: 1.6 }}>
                {sec.other_text}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  }

  // ── FALLBACK path — robust line-by-line parser ─────────────────────────────
  const allLines = text.split("\n");
  // Extract header block (lines before first blank line)
  const firstBlank = allLines.findIndex((l) => !l.trim());
  const hdrEnd = firstBlank === -1 ? Math.min(7, allLines.length) : firstBlank;
  const hdrLines = allLines.slice(0, hdrEnd).filter((l) => l.trim());
  const name = hdrLines[0]?.trim() ?? "";
  const tagline = hdrLines[1]?.trim() ?? "";
  const contactLines = hdrLines.slice(2);
  const remaining = allLines.slice(hdrEnd);

  const elements: React.ReactNode[] = [];
  let key = 0;
  const K = () => `fb-${key++}`;

  for (const rawLine of remaining) {
    const trimmed = rawLine.trim();
    const id = K();
    if (!trimmed) {
      elements.push(<View key={id} style={{ height: 4 }} />);
      continue;
    }

    if (isSectionKw(trimmed)) {
      elements.push(<SectionHeading key={id} label={trimmed.replace(/:$/, "")} />);
      continue;
    }
    if (isBulletLine(rawLine)) {
      const content = trimmed.replace(/^[-•*–○]\s*/, "");
      elements.push(<Bullet key={id} text={content} />);
      continue;
    }
    if (isLabelColon(trimmed)) {
      const colon = trimmed.indexOf(":");
      const lbl = trimmed.slice(0, colon + 1);
      const val = trimmed.slice(colon + 1).trim();
      elements.push(
        <View key={id} style={{ flexDirection: "row", marginBottom: 3, flexWrap: "nowrap" }}>
          <Text
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: ink,
              fontFamily: font,
              flexShrink: 0,
              marginRight: 5,
              minWidth: 72,
            }}
          >
            {lbl}
          </Text>
          <Text style={{ fontSize: 9, color: muted, flex: 1, lineHeight: 1.5, fontFamily: font }}>
            {val}
          </Text>
        </View>
      );
      continue;
    }
    if (isDateOnly(trimmed) && trimmed.length < 70) {
      elements.push(
        <Text
          key={id}
          style={{ fontSize: 8.5, color: faint, fontFamily: font, marginTop: 1, marginBottom: 2 }}
        >
          {trimmed}
        </Text>
      );
      continue;
    }
    if (isEntryHeader(trimmed)) {
      const split = splitDate(trimmed);
      if (split) {
        elements.push(<EntryRow key={id} title={split.title} date={split.date} />);
      } else {
        elements.push(
          <Text
            key={id}
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: ink,
              fontFamily: font,
              marginTop: 7,
              marginBottom: 1,
            }}
          >
            {trimmed}
          </Text>
        );
      }
      continue;
    }
    elements.push(
      <Text
        key={id}
        style={{ fontSize: 9, color: muted, lineHeight: 1.55, marginBottom: 2, fontFamily: font }}
      >
        {trimmed}
      </Text>
    );
  }

  const headerAlign = tok.headerAlignment === "center" ? "center" : "left";
  const nameSize = tok.nameSizeCategory === "large" ? 22 : 17;

  return (
    <View style={{ fontFamily: font }}>
      <Text
        style={{
          fontSize: nameSize,
          fontWeight: 700,
          color: ink,
          fontFamily: font,
          marginBottom: 2,
          textAlign: headerAlign,
        }}
      >
        {name}
      </Text>
      {tagline && (
        <Text
          style={{
            fontSize: 9.5,
            color: muted,
            fontFamily: font,
            marginBottom: 3,
            textAlign: headerAlign,
          }}
        >
          {tagline}
        </Text>
      )}
      {contactLines.map((cl, i) => (
        <Text
          key={`cl-${i}`}
          style={{
            fontSize: 8.5,
            color: faint,
            fontFamily: font,
            marginBottom: 2,
            textAlign: headerAlign,
          }}
        >
          {cl.trim()}
        </Text>
      ))}
      {tok.hasSeparatorLine && (
        <View style={{ marginTop: 8, marginBottom: 10 }}>
          <Svg height={1} width="100%">
            <Line x1="0" y1="0" x2="1000" y2="0" strokeWidth={1} stroke="#d1d5db" />
          </Svg>
        </View>
      )}
      {elements}
    </View>
  );
}
