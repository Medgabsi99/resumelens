"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import TechProTemplate from "@/components/resume-templates/TechProTemplate";
import ProfessionalTemplate from "@/components/resume-templates/ProfessionalTemplate";
import ModernTemplate from "@/components/resume-templates/ModernTemplate";
import SidebarTemplate from "@/components/resume-templates/SidebarTemplate";
import BoldHeaderTemplate from "@/components/resume-templates/BoldHeaderTemplate";
import ElegantTemplate from "@/components/resume-templates/ElegantTemplate";
import { type ParsedResume } from "@/lib/parseResume";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  FolderOpen,
  ArrowLeft,
  CheckCircle,
  LayoutTemplate,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Templates ───────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: "tech-pro", name: "Tech Pro", color: "#1d4ed8", emoji: "🤖", ats: true },
  { id: "professional", name: "Classic", color: "#1e40af", emoji: "🏛️", ats: true },
  { id: "modern", name: "Modern", color: "#0f2044", emoji: "⚡", ats: true },
  { id: "sidebar", name: "Sidebar", color: "#0f4c75", emoji: "📐", ats: false },
  { id: "bold-header", name: "Bold", color: "#7c3aed", emoji: "🎨", ats: false },
  { id: "elegant", name: "Elegant", color: "#92400e", emoji: "✨", ats: false },
] as const;
type TemplateId = (typeof TEMPLATES)[number]["id"];

const TMPL_COMPS: Record<
  TemplateId,
  React.ComponentType<{ resumeText: string; parsedData?: ParsedResume }>
> = {
  "tech-pro": TechProTemplate,
  professional: ProfessionalTemplate,
  modern: ModernTemplate,
  sidebar: SidebarTemplate,
  "bold-header": BoldHeaderTemplate,
  elegant: ElegantTemplate,
};

// ─── Section definitions ──────────────────────────────────────────────────────
const SECTIONS = [
  { id: "contact", label: "Contact", icon: <User size={15} />, color: "#6366f1" },
  { id: "summary", label: "Summary", icon: <Sparkles size={15} />, color: "#8b5cf6" },
  { id: "experience", label: "Experience", icon: <Briefcase size={15} />, color: "#0ea5e9" },
  { id: "education", label: "Education", icon: <GraduationCap size={15} />, color: "#10b981" },
  { id: "skills", label: "Skills", icon: <Wrench size={15} />, color: "#f59e0b" },
  { id: "projects", label: "Projects", icon: <FolderOpen size={15} />, color: "#ec4899" },
  { id: "extras", label: "Extras", icon: <Award size={15} />, color: "#64748b" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

// ─── Data types ───────────────────────────────────────────────────────────────
interface ExpEntry {
  title: string;
  company: string;
  dates: string;
  location: string;
  bullets: string[];
}
interface EduEntry {
  degree: string;
  school: string;
  dates: string;
  gpa: string;
}
interface ProjEntry {
  name: string;
  url: string;
  description: string;
}

interface BD {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  experience: ExpEntry[];
  education: EduEntry[];
  skills: string;
  projects: ProjEntry[];
  certifications: string;
  languages: string;
}

const BLANK: BD = {
  name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  summary: "",
  experience: [{ title: "", company: "", dates: "", location: "", bullets: ["", ""] }],
  education: [{ degree: "", school: "", dates: "", gpa: "" }],
  skills: "",
  projects: [{ name: "", url: "", description: "" }],
  certifications: "",
  languages: "",
};

// ─── Conversion ───────────────────────────────────────────────────────────────
function toParsed(d: BD): ParsedResume {
  return {
    contact: {
      name: d.name,
      email: d.email,
      phone: d.phone,
      location: d.location,
      links: [d.linkedin, d.github].filter(Boolean),
    },
    summary: d.summary || undefined,
    experience: d.experience
      .filter((e) => e.title || e.company)
      .map((e) => ({ ...e, bullets: e.bullets.filter(Boolean) })),
    education: d.education
      .filter((e) => e.degree || e.school)
      .map((e) => ({
        degree: e.degree,
        school: e.school,
        dates: e.dates,
        details: e.gpa ? `GPA: ${e.gpa}` : "",
      })),
    skills: d.skills
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
    projects: d.projects
      .filter((p) => p.name)
      .map((p) => ({ name: p.name, description: p.description })),
    certifications: d.certifications
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
    languages: d.languages
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function pct(d: BD) {
  return Math.round(
    ([
      d.name,
      d.email,
      d.summary,
      d.experience.some((e) => e.title),
      d.education.some((e) => e.degree),
      d.skills,
    ].filter(Boolean).length /
      6) *
      100
  );
}

function sectionFilled(d: BD, id: SectionId): boolean {
  switch (id) {
    case "contact":
      return !!(d.name || d.email);
    case "summary":
      return !!d.summary;
    case "experience":
      return d.experience.some((e) => e.title);
    case "education":
      return d.education.some((e) => e.degree);
    case "skills":
      return !!d.skills;
    case "projects":
      return d.projects.some((p) => p.name);
    case "extras":
      return !!(d.certifications || d.languages);
  }
}

// ─── Input styling ─────────────────────────────────────────────────────────
const INP_BASE: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--paper-card)",
  border: "1.5px solid var(--border)",
  borderRadius: 9,
  padding: "10px 12px",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
  fontFamily: "'Inter', system-ui, sans-serif",
  lineHeight: 1.5,
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function Inp({
  value,
  onChange,
  placeholder,
  type = "text",
  accent = "#6366f1",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  accent?: string;
}) {
  const [f, setF] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        ...INP_BASE,
        borderColor: f ? accent : value ? "var(--ink-muted)" : "var(--border)",
        boxShadow: f ? `0 0 0 3px ${accent}20` : "none",
      }}
    />
  );
}

function TA({
  value,
  onChange,
  placeholder,
  rows = 4,
  accent = "#6366f1",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  accent?: string;
}) {
  const [f, setF] = useState(false);
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        ...INP_BASE,
        resize: "vertical",
        lineHeight: 1.7,
        borderColor: f ? accent : value ? "var(--ink-muted)" : "var(--border)",
        boxShadow: f ? `0 0 0 3px ${accent}20` : "none",
      }}
    />
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 10.5,
        fontWeight: 800,
        color: "var(--ink-muted)",
        marginBottom: 5,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </label>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lbl>{label}</Lbl>
      {children}
    </div>
  );
}

function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {children}
    </div>
  );
}

function Card({
  label,
  onRemove,
  children,
  accent = "#6366f1",
}: {
  label: string;
  onRemove?: () => void;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "var(--paper-warm)",
        border: "1.5px solid var(--border)",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
        {onRemove && (
          <button
            onClick={onRemove}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 9px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 7,
              color: "#ef4444",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Trash2 size={11} /> Remove
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function AddBtn({
  onClick,
  children,
  accent = "#6366f1",
}: {
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 16px",
        background: h ? `${accent}10` : "transparent",
        border: `1.5px dashed ${accent}70`,
        borderRadius: 9,
        color: accent,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <Plus size={14} />
      {children}
    </button>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11.5,
        color: "var(--ink)",
        background: "var(--accent-bg)",
        border: "1px solid var(--accent-border)",
        borderRadius: 8,
        padding: "8px 12px",
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function BuilderPage() {
  const [data, setData] = useState<BD>(() => {
    if (typeof window !== "undefined") {
      try {
        const s = localStorage.getItem("rl_builder_v3");
        if (s) return { ...BLANK, ...JSON.parse(s) };
      } catch {}
    }
    return BLANK;
  });

  const [section, setSection] = useState<SectionId>("contact");
  const [template, setTemplate] = useState<TemplateId>("tech-pro");
  const [preview, setPreview] = useState(true);
  const [downloading, setDl] = useState(false);
  const [savedFlash, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save debounced
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem("rl_builder_v3", JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 600);
  }, [data]);

  const parsed = useMemo(() => toParsed(data), [data]);
  const done = useMemo(() => pct(data), [data]);
  const tpl = TEMPLATES.find((t) => t.id === template)!;
  const Comp = TMPL_COMPS[template];
  const hasContent = !!(data.name || data.summary || data.experience.some((e) => e.title));

  const set = <K extends keyof BD>(k: K, v: BD[K]) => setData((p) => ({ ...p, [k]: v }));
  const setExp = (i: number, p: Partial<ExpEntry>) =>
    setData((d) => {
      const e = [...d.experience];
      e[i] = { ...e[i], ...p };
      return { ...d, experience: e };
    });
  const setEdu = (i: number, p: Partial<EduEntry>) =>
    setData((d) => {
      const e = [...d.education];
      e[i] = { ...e[i], ...p };
      return { ...d, education: e };
    });
  const setProj = (i: number, p: Partial<ProjEntry>) =>
    setData((d) => {
      const e = [...d.projects];
      e[i] = { ...e[i], ...p };
      return { ...d, projects: e };
    });

  const secIdx = SECTIONS.findIndex((s) => s.id === section);
  const curSec = SECTIONS[secIdx];
  const prevSec = SECTIONS[secIdx - 1];
  const nextSec = SECTIONS[secIdx + 1];

  const handleDownload = async () => {
    setDl(true);
    try {
      const { downloadResumePdf } = await import("@/lib/pdf/downloadPdf");
      await downloadResumePdf(template, parsed);
    } catch {
      alert("PDF generation failed. Please try again.");
    } finally {
      setDl(false);
    }
  };

  // ─── Section content renderers ──────────────────────────────────────────

  const renderContact = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
          Contact Information
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>
          Your basic contact details — name, email, phone, location, and social links.
        </p>
      </div>
      <Grid>
        <F label="Full Name *">
          <Inp
            value={data.name}
            onChange={(v) => set("name", v)}
            placeholder="Jane Smith"
            accent="#6366f1"
          />
        </F>
        <F label="Email Address *">
          <Inp
            type="email"
            value={data.email}
            onChange={(v) => set("email", v)}
            placeholder="jane@email.com"
            accent="#6366f1"
          />
        </F>
        <F label="Phone Number">
          <Inp
            value={data.phone}
            onChange={(v) => set("phone", v)}
            placeholder="+1 (555) 000-0000"
            accent="#6366f1"
          />
        </F>
        <F label="City, State / Country">
          <Inp
            value={data.location}
            onChange={(v) => set("location", v)}
            placeholder="New York, NY"
            accent="#6366f1"
          />
        </F>
        <F label="LinkedIn Profile URL">
          <Inp
            value={data.linkedin}
            onChange={(v) => set("linkedin", v)}
            placeholder="linkedin.com/in/username"
            accent="#6366f1"
          />
        </F>
        <F label="GitHub / Portfolio URL">
          <Inp
            value={data.github}
            onChange={(v) => set("github", v)}
            placeholder="github.com/username"
            accent="#6366f1"
          />
        </F>
      </Grid>
      <Tip>
        💡 <strong>Pro tip:</strong> Use a professional email address and ensure your LinkedIn URL
        matches your full name.
      </Tip>
    </div>
  );

  const renderSummary = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
          Professional Summary
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>
          A 2–3 sentence pitch that sits at the top of your resume. Tailor it to each job.
        </p>
      </div>
      <F label="Summary">
        <TA
          value={data.summary}
          onChange={(v) => set("summary", v)}
          rows={6}
          accent="#8b5cf6"
          placeholder="Results-driven Software Engineer with 5+ years of experience building scalable web applications at Google. Expert in React and Node.js. Led teams of 8+ engineers, shipped 3 products with $2M+ combined ARR."
        />
      </F>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Tip>
          💡 <strong>Formula:</strong> [Job title] with [X years] experience in [area]. Expert in
          [top 2–3 skills]. [Biggest impact / achievement].
        </Tip>
        <div style={{ fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic" }}>
          Word count: {data.summary.split(/\s+/).filter(Boolean).length} / ~50 recommended
        </div>
      </div>
    </div>
  );

  const renderExperience = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
          Work Experience
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>
          List your roles starting with the most recent. Use bullet points with metrics.
        </p>
      </div>
      {data.experience.map((exp, i) => (
        <Card
          key={i}
          label={`Position ${i + 1}${exp.title ? ` — ${exp.title}` : ""}`}
          onRemove={
            data.experience.length > 1
              ? () =>
                  set(
                    "experience",
                    data.experience.filter((_, j) => j !== i)
                  )
              : undefined
          }
          accent="#0ea5e9"
        >
          <Grid>
            <F label="Job Title *">
              <Inp
                value={exp.title}
                onChange={(v) => setExp(i, { title: v })}
                placeholder="Software Engineer"
                accent="#0ea5e9"
              />
            </F>
            <F label="Company *">
              <Inp
                value={exp.company}
                onChange={(v) => setExp(i, { company: v })}
                placeholder="Google"
                accent="#0ea5e9"
              />
            </F>
            <F label="Start – End Date">
              <Inp
                value={exp.dates}
                onChange={(v) => setExp(i, { dates: v })}
                placeholder="Jan 2021 – Present"
                accent="#0ea5e9"
              />
            </F>
            <F label="City / Remote">
              <Inp
                value={exp.location}
                onChange={(v) => setExp(i, { location: v })}
                placeholder="Mountain View, CA"
                accent="#0ea5e9"
              />
            </F>
          </Grid>
          <div>
            <Lbl>Achievements — start with action verb + include a metric</Lbl>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {exp.bullets.map((b, bi) => (
                <div key={bi} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span
                    style={{
                      color: "#0ea5e9",
                      fontSize: 18,
                      flexShrink: 0,
                      lineHeight: 1,
                      paddingTop: 1,
                    }}
                  >
                    •
                  </span>
                  <input
                    value={b}
                    onChange={(e) =>
                      setExp(i, {
                        bullets: exp.bullets.map((x, j) => (j === bi ? e.target.value : x)),
                      })
                    }
                    placeholder={
                      bi === 0
                        ? "Led migration to microservices, reducing p99 latency by 40%"
                        : bi === 1
                          ? "Built CI/CD pipeline saving 8 engineering hours per week"
                          : "Add impact-driven achievement…"
                    }
                    style={{
                      ...INP_BASE,
                      flex: 1,
                      borderColor: b ? "var(--ink-muted)" : "var(--border)",
                    }}
                  />
                  {exp.bullets.length > 1 && (
                    <button
                      onClick={() => setExp(i, { bullets: exp.bullets.filter((_, j) => j !== bi) })}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#fca5a5",
                        flexShrink: 0,
                        padding: 4,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setExp(i, { bullets: [...exp.bullets, ""] })}
                style={{
                  alignSelf: "flex-start",
                  background: "none",
                  border: "1px dashed #7dd3fc",
                  borderRadius: 7,
                  padding: "4px 12px",
                  color: "#0ea5e9",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Plus size={12} /> Add bullet point
              </button>
            </div>
          </div>
        </Card>
      ))}
      <AddBtn
        onClick={() =>
          set("experience", [
            ...data.experience,
            { title: "", company: "", dates: "", location: "", bullets: ["", ""] },
          ])
        }
        accent="#0ea5e9"
      >
        Add Another Position
      </AddBtn>
      <Tip>
        💡 Aim for 3–5 bullet points per role. Quantify impact: numbers, %, $, users, time saved.
      </Tip>
    </div>
  );

  const renderEducation = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
          Education
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>
          Your degrees and academic qualifications, most recent first.
        </p>
      </div>
      {data.education.map((edu, i) => (
        <Card
          key={i}
          label={`Degree ${i + 1}${edu.degree ? ` — ${edu.degree}` : ""}`}
          onRemove={
            data.education.length > 1
              ? () =>
                  set(
                    "education",
                    data.education.filter((_, j) => j !== i)
                  )
              : undefined
          }
          accent="#10b981"
        >
          <Grid>
            <F label="Degree / Qualification">
              <Inp
                value={edu.degree}
                onChange={(v) => setEdu(i, { degree: v })}
                placeholder="B.S. Computer Science"
                accent="#10b981"
              />
            </F>
            <F label="University / Institution">
              <Inp
                value={edu.school}
                onChange={(v) => setEdu(i, { school: v })}
                placeholder="MIT"
                accent="#10b981"
              />
            </F>
            <F label="Graduation Year(s)">
              <Inp
                value={edu.dates}
                onChange={(v) => setEdu(i, { dates: v })}
                placeholder="Sep 2016 – Jun 2020"
                accent="#10b981"
              />
            </F>
            <F label="GPA (optional)">
              <Inp
                value={edu.gpa}
                onChange={(v) => setEdu(i, { gpa: v })}
                placeholder="3.9 / 4.0"
                accent="#10b981"
              />
            </F>
          </Grid>
        </Card>
      ))}
      <AddBtn
        onClick={() =>
          set("education", [...data.education, { degree: "", school: "", dates: "", gpa: "" }])
        }
        accent="#10b981"
      >
        Add Another Degree
      </AddBtn>
    </div>
  );

  const renderSkills = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
          Skills
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>
          Technical and soft skills — comma-separated or one per line.
        </p>
      </div>
      <F label="Skills">
        <TA
          value={data.skills}
          onChange={(v) => set("skills", v)}
          rows={8}
          accent="#f59e0b"
          placeholder={
            "React, TypeScript, Next.js, Node.js, Python\nAWS, Docker, Kubernetes, GitHub Actions\nPostgreSQL, MongoDB, Redis, GraphQL\nFigma, Agile, Scrum, JIRA\nTeam leadership, Cross-functional collaboration"
          }
        />
      </F>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {data.skills
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((sk, i) => (
            <span
              key={i}
              style={{
                fontSize: 12,
                fontWeight: 600,
                background: "var(--paper-warm)",
                border: "1px solid var(--border)",
                color: "var(--ink)",
                borderRadius: 100,
                padding: "3px 10px",
              }}
            >
              {sk}
            </span>
          ))}
      </div>
      <Tip>
        💡 List hard skills first (tools, languages, frameworks). ATS systems match job keywords —
        use terms from the job description.
      </Tip>
    </div>
  );

  const renderProjects = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
          Projects
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>
          Side projects, open source contributions, hackathon builds, etc.
        </p>
      </div>
      {data.projects.map((proj, i) => (
        <Card
          key={i}
          label={`Project ${i + 1}${proj.name ? ` — ${proj.name}` : ""}`}
          onRemove={
            data.projects.length > 1
              ? () =>
                  set(
                    "projects",
                    data.projects.filter((_, j) => j !== i)
                  )
              : undefined
          }
          accent="#ec4899"
        >
          <Grid>
            <F label="Project Name">
              <Inp
                value={proj.name}
                onChange={(v) => setProj(i, { name: v })}
                placeholder="ResumeLens AI"
                accent="#ec4899"
              />
            </F>
            <F label="URL (optional)">
              <Inp
                value={proj.url}
                onChange={(v) => setProj(i, { url: v })}
                placeholder="github.com/you/project"
                accent="#ec4899"
              />
            </F>
          </Grid>
          <F label="Description — what you built + impact">
            <TA
              value={proj.description}
              onChange={(v) => setProj(i, { description: v })}
              rows={3}
              accent="#ec4899"
              placeholder="Built real-time resume scanner using Next.js and AI, serving 5,000+ users..."
            />
          </F>
        </Card>
      ))}
      <AddBtn
        onClick={() => set("projects", [...data.projects, { name: "", url: "", description: "" }])}
        accent="#ec4899"
      >
        Add Another Project
      </AddBtn>
    </div>
  );

  const renderExtras = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
          Certifications &amp; Languages
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>
          Additional credentials that boost your candidate profile.
        </p>
      </div>
      <F label="Certifications (one per line)">
        <TA
          value={data.certifications}
          onChange={(v) => set("certifications", v)}
          rows={4}
          accent="#64748b"
          placeholder={
            "AWS Certified Solutions Architect — 2023\nGoogle Cloud Professional Developer — 2022"
          }
        />
      </F>
      <F label="Languages (comma-separated or one per line)">
        <TA
          value={data.languages}
          onChange={(v) => set("languages", v)}
          rows={3}
          accent="#64748b"
          placeholder={"English (Native), Spanish (Fluent), French (Intermediate)"}
        />
      </F>
    </div>
  );

  const RENDERERS: Record<SectionId, () => React.ReactNode> = {
    contact: renderContact,
    summary: renderSummary,
    experience: renderExperience,
    education: renderEducation,
    skills: renderSkills,
    projects: renderProjects,
    extras: renderExtras,
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
        background: "var(--paper-warm)",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          LEFT PANEL
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: preview ? "46%" : "100%",
          minWidth: 400,
          display: "flex",
          flexDirection: "column",
          background: "var(--paper)",
          borderRight: "1.5px solid var(--border)",
          flexShrink: 0,
          transition: "width 0.25s ease",
          overflow: "hidden",
        }}
      >
        {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 16px",
            borderBottom: "1.5px solid var(--border)",
            flexShrink: 0,
            background: "var(--paper-card)",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              color: "var(--ink-muted)",
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div style={{ width: 1, height: 20, background: "var(--border)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              Resume Builder
            </div>
          </div>

          {/* Completion badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
              background: done >= 80 ? "var(--paper-warm)" : "var(--accent-bg)",
              border: `1.5px solid ${done >= 80 ? "#86efac" : "var(--accent-border)"}`,
              borderRadius: 100,
              padding: "3px 10px",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: `conic-gradient(${done >= 80 ? "#22c55e" : "#6366f1"} ${done * 3.6}deg, var(--border) 0)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "var(--paper-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 7,
                  fontWeight: 900,
                  color: done >= 80 ? "#16a34a" : "#6366f1",
                }}
              >
                {done}
              </div>
            </div>
            <span
              style={{ fontSize: 11, fontWeight: 700, color: done >= 80 ? "#16a34a" : "#6366f1" }}
            >
              {done >= 80 ? "Almost done!" : `${done}%`}
            </span>
          </div>

          {/* Save flash */}
          {savedFlash && (
            <span
              style={{
                fontSize: 11,
                color: "#22c55e",
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <CheckCircle size={11} /> Saved
            </span>
          )}

          <button
            onClick={() => setPreview(!preview)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              fontWeight: 700,
              background: preview ? "var(--accent-bg)" : "var(--paper-warm)",
              border: `1.5px solid ${preview ? "var(--accent-border)" : "var(--border)"}`,
              borderRadius: 8,
              padding: "5px 11px",
              cursor: "pointer",
              color: preview ? "var(--accent)" : "var(--ink-muted)",
              flexShrink: 0,
            }}
          >
            {preview ? <EyeOff size={12} /> : <Eye size={12} />}
            {preview ? "Hide Preview" : "Show Preview"}
          </button>
          <ThemeToggle />
        </div>

        {/* ── TEMPLATE BAR ───────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderBottom: "1.5px solid var(--border)",
            flexShrink: 0,
            background: "var(--paper-card)",
            flexWrap: "wrap",
          }}
        >
          <LayoutTemplate size={13} style={{ color: "var(--ink-muted)", flexShrink: 0 }} />
          {TEMPLATES.map((t) => {
            const active = template === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                title={
                  t.ats
                    ? "✅ ATS-safe: single-column, recruiter software friendly"
                    : "⚠️ Visual template: impressive for human reviewers, may not parse perfectly in ATS"
                }
                style={{
                  position: "relative",
                  padding: "5px 11px 5px 11px",
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1.5px solid ${active ? t.color : "var(--border)"}`,
                  background: active ? `${t.color}12` : "var(--paper)",
                  color: active ? t.color : "var(--ink-muted)",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <span>
                  {t.emoji} {t.name}
                </span>
                <span
                  style={{
                    fontSize: 8.5,
                    fontWeight: 800,
                    color: t.ats ? "#16a34a" : "#d97706",
                    letterSpacing: "0.03em",
                  }}
                >
                  {t.ats ? "✓ ATS SAFE" : "◈ VISUAL"}
                </span>
              </button>
            );
          })}
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10.5,
              color: "var(--ink-faint)",
              fontStyle: "italic",
              flexShrink: 0,
            }}
          >
            Hover templates for ATS info
          </span>
        </div>

        {/* ── SECTION NAVIGATION TABS ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            borderBottom: "1.5px solid var(--border)",
            flexShrink: 0,
            overflowX: "auto",
            background: "var(--paper-card)",
          }}
        >
          {SECTIONS.map((s) => {
            const active = s.id === section;
            const filled = sectionFilled(data, s.id);
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "8px 14px",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  background: active ? "var(--paper)" : "transparent",
                  borderBottom: active ? `2.5px solid ${s.color}` : "2.5px solid transparent",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{ color: active ? s.color : filled ? "var(--ink)" : "var(--ink-muted)" }}
                >
                  {s.icon}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: active ? s.color : filled ? "var(--ink)" : "var(--ink-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </span>
                {filled && !active && (
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 8,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#22c55e",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── SECTION FORM CONTENT ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 22px 20px" }}>
          {RENDERERS[section]()}
        </div>

        {/* ── PREV / NEXT + DOWNLOAD BAR ───────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderTop: "1.5px solid var(--border)",
            flexShrink: 0,
            background: "var(--paper-card)",
            flexWrap: "wrap",
          }}
        >
          {prevSec ? (
            <button
              onClick={() => setSection(prevSec.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 14px",
                border: "1.5px solid var(--border)",
                borderRadius: 9,
                background: "var(--paper)",
                color: "var(--ink-muted)",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={14} /> {prevSec.label}
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm("Clear all and start fresh?")) {
                  setData(BLANK);
                  localStorage.removeItem("rl_builder_v3");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 14px",
                border: "1.5px solid #fee2e2",
                borderRadius: 9,
                background: "var(--paper)",
                color: "#ef4444",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} /> Start Fresh
            </button>
          )}

          <div
            style={{
              flex: 1,
              display: "flex",
              gap: 3,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  width: s.id === section ? 18 : 7,
                  height: 7,
                  borderRadius: 100,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  background:
                    s.id === section
                      ? curSec.color
                      : sectionFilled(data, s.id)
                        ? "#86efac"
                        : "var(--border)",
                }}
              />
            ))}
          </div>

          {nextSec ? (
            <button
              onClick={() => setSection(nextSec.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 16px",
                border: "none",
                borderRadius: 9,
                background: curSec.color,
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: `0 2px 12px ${curSec.color}40`,
              }}
            >
              Next: {nextSec.label} <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleDownload}
              disabled={downloading || !data.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 18px",
                border: "none",
                borderRadius: 9,
                background: !data.name
                  ? "var(--border)"
                  : `linear-gradient(135deg, ${tpl.color}, #6366f1)`,
                color: !data.name ? "var(--ink-faint)" : "#fff",
                fontSize: 13,
                fontWeight: 800,
                cursor: !data.name ? "not-allowed" : "pointer",
                boxShadow: data.name ? "0 3px 16px rgba(99,102,241,0.35)" : "none",
              }}
            >
              <Download size={15} />
              {downloading ? "Generating…" : "Download PDF"}
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT PANEL — LIVE PREVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {preview && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "var(--paper-warm)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 18px",
              background: "var(--paper-card)",
              borderBottom: "1.5px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <Eye size={14} style={{ color: "var(--ink-faint)" }} />
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "var(--ink-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Live Preview
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                background: `${tpl.color}15`,
                color: tpl.color,
                border: `1.5px solid ${tpl.color}30`,
                padding: "2px 10px",
                borderRadius: 100,
              }}
            >
              {tpl.emoji} {tpl.name}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic" }}>
              Updates as you type ↻
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 24,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 860,
                background: "var(--paper-card)",
                borderRadius: 4,
                boxShadow: "0 10px 50px rgba(0,0,0,0.2)",
                overflow: "hidden",
                minHeight: 420,
              }}
            >
              {hasContent ? (
                <Comp resumeText="" parsedData={parsed} />
              ) : (
                <div
                  style={{
                    padding: "80px 40px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "var(--paper-warm)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LayoutTemplate size={28} style={{ color: "var(--ink-faint)" }} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
                    Your resume will appear here
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ink-muted)",
                      maxWidth: 260,
                      lineHeight: 1.7,
                    }}
                  >
                    Start with your name in <strong>Contact</strong>, then fill in each section —
                    preview updates live.
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      justifyContent: "center",
                      marginTop: 8,
                    }}
                  >
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTemplate(t.id)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          border: `1.5px solid ${template === t.id ? t.color : "#e2e8f0"}`,
                          background: template === t.id ? `${t.color}12` : "#f8fafc",
                          color: template === t.id ? t.color : "#64748b",
                        }}
                      >
                        {t.emoji} {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
