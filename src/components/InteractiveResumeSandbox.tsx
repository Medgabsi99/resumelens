"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Bot,
  Layers,
  Code2,
  Copy,
  Check,
} from "lucide-react";
import SpotlightCard from "./SpotlightCard";

export interface ArchetypeData {
  id: string;
  role: string;
  badge: string;
  icon: typeof Sparkles;
  beforeScore: number;
  afterScore: number;
  beforeText: string;
  afterText: string;
  highlightedMetrics: string[];
  keywords: string[];
  fullResumeSample: string;
  fullJobSample: string;
  gains: { label: string; pct: number }[];
}

export const ARCHETYPES: ArchetypeData[] = [
  {
    id: "fullstack",
    role: "Senior Full-Stack Lead",
    badge: "Most Popular",
    icon: Code2,
    beforeScore: 52,
    afterScore: 96,
    beforeText:
      "Responsible for building APIs and working on frontend features with React and Node.js. Helped team improve database query speeds and fixed bugs.",
    afterText:
      "Architected 6 high-throughput microservices using Node.js & TypeScript, reducing p99 API latency by 45% across 150K daily active users. Led migration to Next.js App Router, slashing initial bundle load times by 42%.",
    highlightedMetrics: ["45% p99 latency reduction", "150K DAU scale", "42% bundle cut"],
    keywords: ["TypeScript", "Next.js", "Node.js", "PostgreSQL", "Microservices", "CI/CD"],
    gains: [
      { label: "Metric Quantification", pct: 95 },
      { label: "ATS Keyword Match", pct: 98 },
      { label: "Executive Impact", pct: 94 },
    ],
    fullResumeSample: `ALEX MORGAN
San Francisco, CA • (555) 234-5678 • alex.morgan@email.com • linkedin.com/in/alexmorgan

PROFESSIONAL SUMMARY
Senior Full Stack Engineer with 6+ years of experience building scalable microservices and high-conversion web applications. Proven track record of optimizing database performance, reducing p99 API latency by 45%, and mentoring engineering teams.

WORK EXPERIENCE
Senior Software Engineer | TechCorp Inc. | San Francisco, CA | 2021 – Present
• Architected and deployed 6 high-throughput microservices using Node.js, TypeScript, PostgreSQL, and Docker, serving over 150,000 active daily users with 99.99% uptime.
• Reduced frontend bundle load times by 42% by implementing Next.js Server Components and dynamic code splitting.
• Mentored a team of 5 engineers, conducting weekly code reviews and establishing automated CI/CD deployment pipelines using GitHub Actions.

Software Engineer | Innovate Systems | Austin, TX | 2018 – 2021
• Developed RESTful and GraphQL API services in Python/Django, handling 10M+ daily telemetry requests.
• Optimized PostgreSQL query performance and indexed high-volume database tables, dropping p95 latency from 450ms to 85ms.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3
Frameworks: React, Next.js, Node.js, Express, TailwindCSS, Django
Databases & Cloud: PostgreSQL, Redis, MongoDB, AWS (S3, EC2), Docker, Git, CI/CD`,
    fullJobSample: `Senior Full Stack Developer
Company: Acme Cloud Solutions
Location: Remote / San Francisco, CA

About the Role:
We are seeking a Senior Full Stack Engineer to lead the architecture and development of our next-generation developer platform. You will work across TypeScript, React, Next.js, Node.js, and PostgreSQL to deliver high-performance cloud applications.

Key Responsibilities:
- Design and maintain scalable microservices in Node.js and TypeScript.
- Build clean, accessible user interfaces using React and Next.js.
- Optimize database queries and caching layers in PostgreSQL and Redis.

Qualifications:
- 4+ years of production experience with React, TypeScript, and Node.js.
- Strong knowledge of relational databases (PostgreSQL/MySQL) and caching strategies.`,
  },
  {
    id: "ai-ml",
    role: "AI & ML Systems Engineer",
    badge: "Trending 2026",
    icon: Bot,
    beforeScore: 48,
    afterScore: 94,
    beforeText:
      "Trained machine learning models with Python and PyTorch. Worked with OpenAI APIs to build internal chatbots and did some vector database tests.",
    afterText:
      "Engineered an enterprise Contextual RAG pipeline using Gemini 2.5 & pgvector, boosting retrieval precision by 38% and dropping token cost by $14K/month. Fine-tuned PyTorch embeddings for domain-specific technical corpus.",
    highlightedMetrics: ["+38% RAG precision", "$14K/mo cost savings", "0.89 MRR@10"],
    keywords: ["PyTorch", "pgvector", "RAG", "Embeddings", "FastAPI", "LLMOps"],
    gains: [
      { label: "RAG Precision Signals", pct: 96 },
      { label: "Cost-Efficiency Metrics", pct: 92 },
      { label: "Technical Specificity", pct: 95 },
    ],
    fullResumeSample: `ELENA VANCE
Seattle, WA • (555) 345-6789 • elena.vance@email.com • github.com/elenavance-ai

PROFESSIONAL SUMMARY
Machine Learning Systems Engineer specializing in Generative AI architectures, Contextual RAG pipelines, and high-throughput model inference. Delivered $14K/mo compute cost optimizations through quantization and embedding fine-tuning.

WORK EXPERIENCE
AI Systems Engineer | NeuralScale AI | Seattle, WA | 2022 – Present
• Engineered enterprise Contextual RAG pipeline with pgvector and Gemini 2.5 Flash, boosting retrieval precision by 38% across 2M+ vectorized technical documents.
• Reduced inference latency by 55% by implementing TensorRT-LLM and 4-bit AWQ quantization on AWS A100 clusters.
• Designed automated evaluation harness (RAGAS + TruLens) evaluating semantic similarity, faithfulness, and context recall in production.

Machine Learning Engineer | Apex Data | San Jose, CA | 2020 – 2022
• Trained multi-modal embedding models in PyTorch with contrastive learning, improving search recall@10 from 0.62 to 0.89.
• Deployed asynchronous inference microservices using FastAPI, Celery, and Redis Streams processing 800 req/sec.

TECHNICAL SKILLS
AI/ML: PyTorch, Hugging Face, LangChain, LlamaIndex, vLLM, TensorRT-LLM, RAGAS
Languages: Python, C++, SQL, Bash
Infrastructure: Docker, Kubernetes, Ray, Triton Inference Server, AWS (SageMaker, EC2), pgvector, Pinecone`,
    fullJobSample: `Senior AI & LLM Systems Engineer
Company: Cognitive Core AI
Location: Remote / Seattle, WA

Role Overview:
We are seeking an AI Systems Engineer to build production-grade Generative AI pipelines, contextual retrieval architectures, and low-latency inference services.

Responsibilities:
- Build, optimize, and evaluate RAG pipelines using vector databases (pgvector/Pinecone) and LLM APIs.
- Optimize model latency and token efficiency across production workloads.
- Work with PyTorch, FastAPI, and Kubernetes to deploy scalable inference engines.

Requirements:
- 3+ years experience with Python, PyTorch, and vector retrieval systems.
- Production experience deploying LLMs, fine-tuning embeddings, and evaluating RAG accuracy.`,
  },
  {
    id: "product-architect",
    role: "Principal Product Architect",
    badge: "Executive Tier",
    icon: Layers,
    beforeScore: 54,
    afterScore: 98,
    beforeText:
      "Lead developer managing product roadmap and engineering team. Talked to stakeholders, wrote technical specs, and made architecture decisions.",
    afterText:
      "Steered 14-engineer cross-functional squad delivering flagship $4.2M ARR SaaS product from 0 to 1. Championed event-driven architecture with Apache Kafka, unlocking 99.995% SLA and scaling throughput to 50K ops/sec.",
    highlightedMetrics: ["$4.2M ARR delivered", "99.995% SLA reliability", "50K ops/sec scale"],
    keywords: [
      "System Architecture",
      "Kafka",
      "SaaS",
      "Microservices",
      "Event-Driven",
      "SLA 99.99%",
    ],
    gains: [
      { label: "Business ROI Framing", pct: 98 },
      { label: "Architecture Depth", pct: 96 },
      { label: "Leadership Signals", pct: 99 },
    ],
    fullResumeSample: `MARCUS CHEN
New York, NY • (555) 456-7890 • marcus.chen@email.com • linkedin.com/in/marcuschen-lead

PROFESSIONAL SUMMARY
Principal Technical Architect and Engineering Leader with 10+ years directing mission-critical SaaS architectures. Delivered $4.2M ARR new revenue lines and managed 14-engineer distributed squads across US and EMEA.

WORK EXPERIENCE
Principal Solutions Architect | CloudFlow Technologies | New York, NY | 2021 – Present
• Steered 14-engineer cross-functional squad delivering flagship $4.2M ARR SaaS platform from 0 to 1 on schedule.
• Championed event-driven architecture using Apache Kafka, RabbitMQ, and Golang microservices, achieving 99.995% uptime SLA.
• Partnered with VP of Product and C-Suite stakeholders to define multi-year technical roadmap and cloud cost governance.

Lead Software Architect | Quantex FinTech | Boston, MA | 2017 – 2021
• Decomposed monolithic legacy billing system into 12 domain-driven microservices, reducing deployment cycle time from 2 weeks to 25 minutes.
• Instituted automated security scanning and SOC 2 Type II compliance audit framework.

TECHNICAL SKILLS
Architecture: Domain-Driven Design (DDD), Event-Driven, Microservices, CQRS, Zero-Trust Security
Languages: Go, TypeScript, Python, Java
Cloud & Data: AWS, GCP, Apache Kafka, PostgreSQL, DynamoDB, Redis, Terraform, Kubernetes`,
    fullJobSample: `Principal Platform Architect
Company: ScaleOps Enterprise
Location: New York, NY / Hybrid

About the Position:
Looking for a Principal Architect to guide enterprise cloud platforms, define architectural roadmaps, and mentor engineering teams across complex distributed systems.

Key Requirements:
- 8+ years architecting scalable cloud platforms (AWS/GCP), event-driven architectures (Kafka), and microservices.
- Proven leadership directing technical strategy, SLA guarantees, and cross-functional engineering teams.`,
  },
];

interface Props {
  onSelectSample?: (resumeText: string, jobDescription: string, role: string) => void;
}

export default function InteractiveResumeSandbox({ onSelectSample }: Props) {
  const [selectedId, setSelectedId] = useState<string>("fullstack");
  const [copied, setCopied] = useState(false);

  const current = ARCHETYPES.find((a) => a.id === selectedId) || ARCHETYPES[0];
  const delta = current.afterScore - current.beforeScore;

  const handleCopy = () => {
    navigator.clipboard.writeText(current.afterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadIntoScanner = () => {
    if (onSelectSample) {
      onSelectSample(current.fullResumeSample, current.fullJobSample, current.role);
    }
  };

  return (
    <div className="w-full my-8">
      {/* ── Section Eyebrow & Headline ───────────────────────────── */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 mb-2">
          <Sparkles size={12} className="text-amber-500 animate-pulse" />
          <span>Interactive ATS Transformation Engine</span>
        </div>
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Watch AI transform weak bullets into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-500 italic">
            top 5% offers
          </span>
        </h3>
        <p className="text-ink-muted text-xs sm:text-sm max-w-lg mx-auto mt-1">
          Select an archetype to see the real-time XYZ-quantification formula in action.
        </p>
      </div>

      {/* ── Archetype Tabs ───────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
        {ARCHETYPES.map((arch) => {
          const isSelected = arch.id === selectedId;
          const Icon = arch.icon;
          return (
            <button
              key={arch.id}
              type="button"
              onClick={() => setSelectedId(arch.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? "bg-accent text-white border-accent shadow-md shadow-accent/20 scale-[1.02]"
                  : "bg-paper-card text-ink-muted hover:text-ink border-border hover:border-accent-border"
              }`}
            >
              <Icon size={14} className={isSelected ? "text-white" : "text-accent"} />
              <span>{arch.role}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-accent/10 text-accent"
                }`}
              >
                {arch.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Live Before / After Transformer Box ──────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <SpotlightCard className="specular-border p-6 sm:p-8" specularBorder={true}>
            {/* Top Score Comparison Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20 font-mono font-bold">
                  {current.afterScore}
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-ink-muted uppercase tracking-wider">
                    Simulated ATS Benchmark
                  </div>
                  <div className="text-sm font-bold text-ink flex items-center gap-2">
                    <span>{current.role}</span>
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <TrendingUp size={12} />+{delta} pts jump
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-paper-warm text-ink-muted hover:text-ink border border-border flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy Rewrite"}</span>
                </button>
                {onSelectSample && (
                  <button
                    type="button"
                    onClick={handleLoadIntoScanner}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-accent text-white hover:bg-accent-hover flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <Zap size={13} fill="currentColor" />
                    <span>Scan This Role Sample</span>
                  </button>
                )}
              </div>
            </div>

            {/* Split Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* BEFORE CARD */}
              <div className="rounded-xl p-5 border border-red-500/20 bg-red-500/[0.03] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase text-red-500 flex items-center gap-1.5">
                      <AlertTriangle size={13} />
                      Before: Typical Resume (Score {current.beforeScore})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
                      Rejected by ATS
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-muted font-mono leading-relaxed bg-paper/60 p-3 rounded-lg border border-border/50">
                    "{current.beforeText}"
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-red-500/10 text-[11px] text-red-600/80 dark:text-red-400/80 flex items-center gap-1.5 font-medium">
                  <span>❌ Vague responsibilities • Missing metrics • Low keyword density</span>
                </div>
              </div>

              {/* AFTER CARD */}
              <div className="rounded-xl p-5 border border-emerald-500/30 bg-emerald-500/[0.04] flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      After: XYZ-Quantified (Score {current.afterScore})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Flame size={11} />
                      Top 3% Pick
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-ink font-mono font-medium leading-relaxed bg-paper/90 p-3 rounded-lg border border-emerald-500/30 shadow-sm">
                    "{current.afterText}"
                  </p>
                </div>

                {/* Highlighted Metric Tags */}
                <div className="mt-4 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase mr-1">
                    Quantified Metrics:
                  </span>
                  {current.highlightedMetrics.map((m) => (
                    <span
                      key={m}
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    >
                      ✓ {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Keyword Density & Category Gains Bar */}
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-ink-muted uppercase">
                  ATS Keywords Injected:
                </span>
                {current.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-paper-warm text-ink font-semibold border border-border"
                  >
                    +{kw}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                {current.gains.map((g) => (
                  <div key={g.label} className="flex items-center gap-1.5">
                    <span className="text-ink-muted text-[10px]">{g.label}:</span>
                    <strong className="text-emerald-500 font-bold">{g.pct}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
