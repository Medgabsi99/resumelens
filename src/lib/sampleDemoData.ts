import type { AnalysisResult } from "@/types";

export interface DemoArchetype {
  id: "swe" | "pm" | "ml";
  name: string;
  role: string;
  badge: string;
  resumeText: string;
  jobDescription: string;
  result: AnalysisResult;
}

export const DEMO_ARCHETYPES: Record<"swe" | "pm" | "ml", DemoArchetype> = {
  swe: {
    id: "swe",
    name: "Software Engineering",
    role: "Senior Full-Stack Engineer",
    badge: "Score: 74/100 (Needs Improvement)",
    resumeText: `ALEX RIVERA
San Francisco, CA • alex.rivera@example.com • (555) 234-5678 • linkedin.com/in/alexrivera-demo • github.com/alexrivera-demo

PROFESSIONAL SUMMARY
Senior Full-Stack Software Engineer with 6+ years of experience building high-scale web platforms. Specialized in TypeScript, React, Next.js, Node.js, and distributed PostgreSQL databases. Passionate about developer tooling, API latency reduction, and microservice architectures.

PROFESSIONAL EXPERIENCE
Senior Software Engineer — CloudScale Technologies | 2021 – Present
• Architected and deployed event-driven microservices in Node.js, TypeScript, and Redis, serving 250,000+ daily active users with 99.98% uptime.
• Spearheaded migration of legacy monolith to Next.js App Router and server actions, reducing frontend p95 bundle load times by 38%.
• Designed robust REST & GraphQL API endpoints connecting PostgreSQL read-replicas, improving query execution latency by 45%.
• Mentored 6 mid-level engineers through bi-weekly architectural RFC design reviews and automated CI/CD GitHub Action quality gates.

Full-Stack Developer — Innovate Labs | 2018 – 2021
• Built customer-facing dashboard in React, TailwindCSS, and Redux Toolkit used by 45 enterprise B2B accounts.
• Implemented automated integration test suites with Playwright and Jest, increasing overall test coverage from 42% to 84%.
• Collaborated with product designers to implement WCAG 2.1 AA accessible UI component design systems.

EDUCATION
B.S. in Computer Science — University of California, Berkeley | 2014 – 2018

TECHNICAL SKILLS
Languages: TypeScript, JavaScript (ES2024), Python, SQL, HTML5, CSS3
Frameworks & Libraries: React, Next.js, Node.js, Express, TailwindCSS, GraphQL, Redux Toolkit
Infrastructure & Tools: PostgreSQL, Redis, Docker, AWS (S3, EC2, CloudFront), Git, CI/CD, Jest, Playwright`,
    jobDescription: `Senior Full Stack Engineer
Company: Apex Cloud Systems
Location: San Francisco, CA / Remote

About the Role:
We are seeking an experienced Senior Full Stack Engineer to lead the architecture of our cloud observability platform. You will build high-throughput microservices in TypeScript, Go, or Node.js, manage containerized deployments in Kubernetes, and build delightful React user interfaces.

Qualifications:
- 5+ years of production experience in TypeScript, React, and Node.js.
- Strong hands-on experience with Docker, Kubernetes, and AWS/GCP cloud environments.
- Proven track record optimizing relational databases (PostgreSQL) and caching layers (Redis).
- Experience with GraphQL federation or gRPC microservices is a huge plus.`,
    result: {
      score: 74,
      summary:
        "Strong full-stack engineering profile with clear technical ownership and quantifiable performance optimizations. To achieve a 90+ ATS score for Apex Cloud Systems, incorporate explicit container orchestration keywords (Kubernetes) and mention gRPC or GraphQL federation experience in your recent bullet points.",
      strengths: [
        "Quantified impact metrics present across major experience bullets (38% bundle reduction, 45% query latency improvement)",
        "Strong core tech stack alignment with TypeScript, React, Node.js, PostgreSQL, and Redis",
        "Demonstrated technical leadership and mentoring experience (led 6 engineers and RFC reviews)",
        "Clear, ATS-compliant single-column typographic hierarchy",
      ],
      weaknesses: [
        "Missing target job keywords: Kubernetes, gRPC, and GraphQL Federation",
        "Could expand on AWS cloud architectural scale (e.g. Terraform infrastructure-as-code)",
        "Include more executive-level business metrics (cost savings, revenue unlocked)",
      ],
      keywords_matched: [
        "TypeScript",
        "React",
        "Next.js",
        "Node.js",
        "PostgreSQL",
        "Redis",
        "Docker",
        "AWS",
        "GraphQL",
        "CI/CD",
        "REST API",
        "Microservices",
        "Jest",
        "Playwright",
      ],
      keywords_missing: [
        "Kubernetes",
        "gRPC",
        "Cloud Observability",
        "GraphQL Federation",
        "Terraform",
      ],
      suggestions: [
        {
          section: "CloudScale Technologies — Architecture",
          before:
            "Architected and deployed event-driven microservices in Node.js, TypeScript, and Redis, serving 250,000+ daily active users with 99.98% uptime.",
          after:
            "Architected containerized microservices in Docker and Kubernetes (EKS) using TypeScript and Redis, scaling to 250k+ daily users while maintaining 99.98% uptime.",
        },
        {
          section: "CloudScale Technologies — APIs",
          before:
            "Designed robust REST & GraphQL API endpoints connecting PostgreSQL read-replicas, improving query execution latency by 45%.",
          after:
            "Engineered federated GraphQL and gRPC microservice APIs with PostgreSQL read-replicas, slashing p95 endpoint latency by 45% and handling 12M monthly queries.",
        },
        {
          section: "Innovate Labs — Testing & Reliability",
          before:
            "Implemented automated integration test suites with Playwright and Jest, increasing overall test coverage from 42% to 84%.",
          after:
            "Spearheaded end-to-end automated testing with Playwright, Jest, and GitHub Actions, boosting test coverage from 42% to 84% and preventing 15+ production regressions.",
        },
      ],
      ats_breakdown: {
        format: 92,
        keywords: 72,
        impact: 84,
        readability: 90,
      },
    },
  },

  pm: {
    id: "pm",
    name: "Product Management",
    role: "Senior Product Manager",
    badge: "Score: 68/100 (Needs Improvement)",
    resumeText: `SARAH CHEN
New York, NY • sarah.chen@example.com • (555) 345-6789 • linkedin.com/in/sarahchen-pm

SUMMARY
Data-driven Senior Product Manager with 5+ years driving SaaS product strategy, go-to-market execution, and cross-functional team leadership across engineering, design, and sales.

EXPERIENCE
Product Manager — FinTech Global | 2021 – Present
• Defined product roadmap for core payments checkout, resulting in higher transaction volume.
• Worked with engineering and UX designers to conduct user interviews and launch multi-currency wallet.
• Ran A/B experiments on onboarding funnels to improve activation rates.
• Managed backlog and sprint planning for 12 engineers and 2 UX designers using Jira and Amplitude.

Associate Product Manager — RetailFlow | 2019 – 2021
• Launched self-serve customer onboarding portal, reducing support tickets.
• Analyzed user drop-off telemetry in Mixpanel and SQL to identify conversion bottlenecks.
• Authored comprehensive PRDs and product requirement specifications for engineering sprints.

EDUCATION
B.A. in Economics & Information Systems — Columbia University | 2015 – 2019

SKILLS
Product Strategy: Roadmapping, PRD Writing, A/B Testing, User Research, OKRs, Product Discovery
Analytics & Tools: SQL, Amplitude, Mixpanel, Jira, Figma, Tableau, Google Analytics`,
    jobDescription: `Senior Product Manager (Growth & Monetization)
Company: NextWave SaaS
Location: New York, NY / Hybrid

We are looking for a Senior Product Manager to spearhead our Growth & Self-Serve Monetization engine. You will own the end-to-end user acquisition, trial conversion, and subscription expansion funnels.

Requirements:
- 4+ years of product management experience in B2B SaaS or consumer growth.
- Proven track record increasing ARR, trial-to-paid conversion (LTV/CAC), and net retention.
- Deep expertise in experiment design, statistical significance, and cohort analysis.
- Experience with PLG (Product-Led Growth) frameworks.`,
    result: {
      score: 68,
      summary:
        "Good foundational PM experience, but currently lacks quantified business revenue metrics (ARR growth, retention percentages, LTV/CAC ratios). For a growth role at NextWave SaaS, rewrite your bullets using the Google XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.",
      strengths: [
        "Solid product discovery and agile execution background (PRD writing, user interviews)",
        "Hands-on analytics tooling experience (SQL, Amplitude, Mixpanel, Tableau)",
        "Experience leading cross-functional teams of 12+ engineers and designers",
      ],
      weaknesses: [
        "Vague outcome statements ('resulting in higher transaction volume' lacks specific % or dollar metrics)",
        "Missing critical PLG & Monetization keywords: ARR, Net Retention Rate (NRR), LTV/CAC, Cohort Analysis",
        "Needs more focus on strategic business outcomes rather than just task execution",
      ],
      keywords_matched: [
        "Product Strategy",
        "Roadmap",
        "A/B Testing",
        "User Interviews",
        "PRD",
        "SQL",
        "Amplitude",
        "Mixpanel",
        "Jira",
        "Figma",
      ],
      keywords_missing: [
        "ARR Growth",
        "Product-Led Growth (PLG)",
        "Trial Conversion",
        "Net Retention Rate",
        "Cohort Analysis",
        "Monetization",
      ],
      suggestions: [
        {
          section: "FinTech Global — Roadmap & Conversion",
          before:
            "Defined product roadmap for core payments checkout, resulting in higher transaction volume.",
          after:
            "Spearheaded growth roadmap for core checkout, increasing quarterly GMV by $18M (+24%) and lifting trial-to-paid conversion by 3.4 percentage points.",
        },
        {
          section: "FinTech Global — A/B Testing",
          before: "Ran A/B experiments on onboarding funnels to improve activation rates.",
          after:
            "Executed 14 multivariate onboarding experiments using Amplitude and Optimizely, driving a 31% surge in Day-7 user activation and lowering churn by 12%.",
        },
        {
          section: "RetailFlow — Self-Serve Onboarding",
          before: "Launched self-serve customer onboarding portal, reducing support tickets.",
          after:
            "Conceived and launched a zero-touch PLG onboarding workflow, cutting onboarding support tickets by 45% while decreasing time-to-first-value from 5 days to 40 minutes.",
        },
      ],
      ats_breakdown: {
        format: 88,
        keywords: 62,
        impact: 58,
        readability: 82,
      },
    },
  },

  ml: {
    id: "ml",
    name: "Machine Learning & AI",
    role: "Machine Learning Engineer",
    badge: "Score: 82/100 (Strong Match)",
    resumeText: `MARCUS VANCE
Seattle, WA • marcus.vance@example.com • (555) 456-7890 • linkedin.com/in/marcusvance-ai • github.com/marcusvance-ai

PROFESSIONAL SUMMARY
Machine Learning Engineer with 4+ years of expertise in Generative AI, Retrieval-Augmented Generation (RAG), PyTorch, and distributed model inference. Built production NLP & computer vision pipelines serving millions of real-time predictions.

EXPERIENCE
Machine Learning Engineer — Nexus AI Labs | 2022 – Present
• Designed and deployed an enterprise RAG pipeline indexing 5M+ corporate documents using Qdrant vector database and Gemini embeddings, achieving 94% retrieval precision.
• Fine-tuned open-weights LLMs (Llama-3, Mistral) with LoRA and QLoRA for domain-specific medical and financial summarization tasks.
• Optimized model inference latency using TensorRT-LLM and vLLM on NVIDIA H100 GPUs, reducing time-to-first-token by 52% (from 420ms to 201ms).
• Built automated evaluation benchmarks tracking hallucination rate, semantic cosine similarity, and BERTScore across 10,000 test queries.

AI Research Engineer — VisionTech Systems | 2020 – 2022
• Developed real-time object detection models in PyTorch and TorchScript deployed on edge devices with 60 FPS throughput.
• Implemented data augmentation and semi-supervised active learning pipelines, reducing labeling costs by 60%.

EDUCATION
M.S. in Computer Science (Machine Learning Specialization) — University of Washington | 2018 – 2020
B.S. in Applied Mathematics — University of Washington | 2014 – 2018

TECHNICAL SKILLS
ML & AI: PyTorch, Hugging Face, TensorRT-LLM, vLLM, LangChain, LlamaIndex, Qdrant, FAISS
Tools & Cloud: Python, C++, CUDA, Docker, Kubernetes, AWS SageMaker, GCP Vertex AI, MLflow`,
    jobDescription: `Staff Machine Learning Engineer (LLM Infrastructure)
Company: HyperScale AI
Location: Seattle, WA / Remote

We are seeking a Staff ML Engineer to build production-grade LLM inference engines and RAG search systems.

Responsibilities:
- Build high-throughput, low-latency LLM serving infrastructure using vLLM / TensorRT.
- Design advanced RAG pipelines with hybrid search, re-ranking, and vector embeddings.
- Implement continuous model evaluation for hallucination mitigation, safety, and latency SLAs.

Requirements:
- 4+ years of production experience with PyTorch, CUDA, and distributed LLM serving.
- Deep familiarity with vector databases (Qdrant, Pinecone, Milvus, pgvector).
- Experience optimizing GPU memory bandwidth (KV-cache management, PagedAttention).`,
    result: {
      score: 82,
      summary:
        "Exceptional Machine Learning resume with cutting-edge LLM serving metrics (vLLM, TensorRT, LoRA). To reach a 95+ score for HyperScale AI, highlight specific GPU memory optimizations (PagedAttention, KV-cache quantization) and hybrid BM25 + dense re-ranking architectures.",
      strengths: [
        "Outstanding production LLM serving metrics (52% TTFT latency drop using TensorRT/vLLM)",
        "Direct experience with modern RAG architectures and vector databases (Qdrant, pgvector)",
        "Strong automated evaluation rigor (hallucination scoring, BERTScore, cosine similarity)",
        "Master's degree in Computer Science with ML specialization",
      ],
      weaknesses: [
        "Could explicitly highlight memory bandwidth techniques (PagedAttention, FP8 quantization)",
        "Mention hybrid search fusion algorithms (Reciprocal Rank Fusion / Cross-Encoder re-ranking)",
      ],
      keywords_matched: [
        "PyTorch",
        "TensorRT-LLM",
        "vLLM",
        "RAG",
        "Vector Database",
        "Qdrant",
        "LoRA",
        "CUDA",
        "Hugging Face",
        "Docker",
        "Kubernetes",
        "BERTScore",
      ],
      keywords_missing: [
        "PagedAttention",
        "KV Cache Quantization",
        "Hybrid Search Fusion",
        "Cross-Encoder Re-ranking",
        "FP8 Precision",
      ],
      suggestions: [
        {
          section: "Nexus AI Labs — RAG Architecture",
          before:
            "Designed and deployed an enterprise RAG pipeline indexing 5M+ corporate documents using Qdrant vector database and Gemini embeddings, achieving 94% retrieval precision.",
          after:
            "Architected enterprise hybrid RAG system with BM25 + dense Qdrant vector search and Cross-Encoder re-ranking, boosting precision@5 to 96.4% across 5M+ documents.",
        },
        {
          section: "Nexus AI Labs — Model Optimization",
          before:
            "Optimized model inference latency using TensorRT-LLM and vLLM on NVIDIA H100 GPUs, reducing time-to-first-token by 52% (from 420ms to 201ms).",
          after:
            "Engineered high-throughput LLM serving via vLLM with PagedAttention and FP8 KV-cache quantization, reducing time-to-first-token by 52% while doubling concurrent GPU stream capacity.",
        },
      ],
      ats_breakdown: {
        format: 96,
        keywords: 84,
        impact: 92,
        readability: 94,
      },
    },
  },
};
