"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Cpu,
  FileText,
  Target,
  PenTool,
  BarChart3,
  MessageSquare,
  Briefcase,
  ChevronDown,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 26, delay: i * 0.08 },
  }),
};

const STEPS = [
  {
    number: "01",
    icon: Upload,
    title: "Paste or drop your resume",
    body: "Plain text or PDF — we extract the content automatically. No account required to start.",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI scans every dimension",
    body: "Format, keyword density, impact language, readability, and ATS compatibility — scored against 200+ resume signals.",
  },
  {
    number: "03",
    icon: Target,
    title: "Get an actionable plan",
    body: "Specific rewrite suggestions, missing keywords, bullet improvements, and a downloadable report — not vague advice.",
  },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "ATS Score Breakdown",
    body: "Format, keywords, impact, and readability — each scored separately so you know exactly what to fix.",
  },
  {
    icon: PenTool,
    title: "AI Bullet Rewriter",
    body: "Paste any weak bullet. Get 3 XYZ-method rewrites with stronger verbs and quantified impact.",
  },
  {
    icon: Target,
    title: "Job Match Analysis",
    body: "Paste a job description. See keyword gaps, match percentage, and tailored suggestions.",
  },
  {
    icon: MessageSquare,
    title: "Cover Letter Generator",
    body: "Role-specific cover letters in your voice, generated from your resume content in under 30 seconds.",
  },
  {
    icon: Briefcase,
    title: "Application Tracker",
    body: "Kanban board to track every role — company, status, follow-up dates, salary range, contact details.",
  },
  {
    icon: FileText,
    title: "PDF Export",
    body: "Download a polished analysis report in 5 professional templates. Share it or keep it for reference.",
  },
];

const FAQS = [
  {
    q: "Do I need to create an account?",
    a: "No. You can analyze one resume without signing up. Create a free account to save your history, access the full report, and use the AI rewriter.",
  },
  {
    q: "Is my resume data stored or shared?",
    a: "Resume text is processed in-memory for analysis and not stored unless you explicitly save a result. We never share your data with third parties.",
  },
  {
    q: "What makes this different from other resume checkers?",
    a: "Most tools give a single score and vague advice. ResumeLens gives a breakdown across 4 ATS dimensions, specific bullet rewrites with the XYZ method, job description matching, and an application tracker — all in one place.",
  },
  {
    q: "Does it work for any industry or role?",
    a: "Yes. The AI adapts to the role you specify. If you paste a job description, keyword analysis is tailored to that exact posting. Without one, it scores against general industry standards.",
  },
  {
    q: "What does the Pro plan include?",
    a: "Unlimited analyses, full AI rewriter access, cover letter generation, interview prep, salary negotiation coach, and PDF export in all templates.",
  },
];

const TRUST = [
  { icon: Zap,         label: "Instant results — no waiting" },
  { icon: ShieldCheck, label: "No resume stored by default" },
  { icon: Lock,        label: "Encrypted in transit" },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="border-b last:border-0"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center py-5 text-left gap-4 cursor-pointer"
      >
        <span className="font-semibold text-sm text-ink">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="flex-shrink-0 text-ink-faint"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ overflow: "hidden" }}
          >
            <p className="text-sm text-ink-muted leading-relaxed pb-5 max-w-2xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase mb-3 flex items-center justify-center gap-3"
      style={{ color: "var(--accent)" }}
    >
      <div className="w-6 h-px" style={{ background: "var(--accent)" }} />
      {children}
      <div className="w-6 h-px" style={{ background: "var(--accent)" }} />
    </div>
  );
}

export default function HomepageMarketing() {
  return (
    <div className="w-full mt-24 mb-16">

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 mb-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 240, damping: 26 }}
          className="text-center mb-14"
        >
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl text-ink font-bold tracking-tight">
            From paste to plan in&nbsp;60&nbsp;seconds
          </h2>
          <p className="text-ink-muted mt-3 text-base max-w-xl mx-auto">
            No sign-up friction. No questionnaires. Drop your resume and the AI handles the rest.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div
            className="hidden md:block absolute top-10 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-px"
            style={{ background: "linear-gradient(90deg, var(--accent-border), var(--accent), var(--accent-border))", opacity: 0.5 }}
          />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="glass-card rounded-2xl p-6 flex flex-col items-center text-center relative"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-mono text-xs font-bold mb-4 relative z-10"
                style={{ background: "var(--accent)" }}
              >
                {step.number}
              </div>
              <step.icon size={20} className="mb-3" style={{ color: "var(--accent)" }} />
              <h3 className="font-semibold text-sm text-ink mb-2">{step.title}</h3>
              <p className="text-ink-muted text-xs leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust bar */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-28"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--paper-warm)" }}
      >
        <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-ink-muted text-xs font-medium">
              <Icon size={14} style={{ color: "var(--accent)" }} className="flex-shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Feature Grid */}
      <section className="max-w-5xl mx-auto px-6 mb-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 240, damping: 26 }}
          className="text-center mb-12"
        >
          <SectionEyebrow>Everything included</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl text-ink font-bold tracking-tight">
            Not just a score — a complete toolkit
          </h2>
          <p className="text-ink-muted mt-3 text-base max-w-xl mx-auto">
            Every tool a job seeker needs, in one place. No subscription required to start.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="glass-card card-lift rounded-2xl p-6"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}
              >
                <f.icon size={16} style={{ color: "var(--accent)" }} />
              </div>
              <h3 className="font-semibold text-sm text-ink mb-1.5">{f.title}</h3>
              <p className="text-ink-muted text-xs leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 240, damping: 26 }}
          className="text-center mb-10"
        >
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="font-display text-3xl sm:text-4xl text-ink font-bold tracking-tight">
            Common questions
          </h2>
        </motion.div>
        <div className="glass-card rounded-2xl px-6" style={{ border: "1px solid var(--border)" }}>
          {FAQS.map((faq, i) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </section>

      {/* CTA nudge */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        className="max-w-xl mx-auto px-6 text-center"
      >
        <div
          className="rounded-2xl p-10"
          style={{ background: "linear-gradient(135deg, var(--accent-bg) 0%, var(--paper-warm) 100%)", border: "1px solid var(--accent-border)" }}
        >
          <h3 className="font-display text-2xl font-bold text-ink mb-2">
            Ready to see your score?
          </h3>
          <p className="text-ink-muted text-sm mb-6">
            Paste your resume above — it takes 10 seconds and no sign-up is needed.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="btn-gradient px-7 py-3 rounded-xl text-sm font-semibold cursor-pointer inline-flex items-center gap-2"
          >
            Analyze your resume
            <span aria-hidden="true">&#8593;</span>
          </button>
        </div>
      </motion.section>
    </div>
  );
}
