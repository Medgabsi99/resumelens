# ResumeLens — Transcendent AI Resume Reviewer & Career Workspace

A studio-grade, executive career intelligence platform providing deep structured ATS auditing, real-time eye-tracking recruiter simulations, FAANG cultural benchmarks, in-line Ghost-AI editing, and aggregate job search analytics. Built with **React 19**, **Next.js 16**, **Google Gemini & Multi-LLM Fallbacks**, **Supabase Auth & Database**, **Web Audio Haptics**, and **100% Free & Open Access**.

---

## ⚡ Stack & Architecture

| Layer                           | Technology                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Framework**                   | **Next.js 16.2.10 (App Router, Turbopack & Webpack)**                                                     |
| **Rendering Engine**            | **React 19.0.0 (Stable)**                                                                                 |
| **Design System**               | **Studio Design Tokens + Vanilla CSS Variables** (Linear/Apple Darkroom & Warm Paper)                     |
| **Motion & Micro-Interactions** | **Framer Motion 12** (Hardware-accelerated 120 FPS spring physics)                                        |
| **Sound & Haptics**             | **Native Web Audio API (`AudioContext`)** (0 kB network payload synthesizer + 8ms physical haptic pulses) |
| **AI Intelligence Engine**      | **Multi-LLM Circuit Breaker** (Google Gemini 3.5 Flash ➔ Anthropic Claude 3.5 Haiku ➔ Local Heuristics)   |
| **Parsing Engine**              | **Off-Thread Web Workers** (`pdf-parse`, `mammoth`, LCS Word-Diff Tokenizer)                              |
| **Database & Vector RAG**       | **Supabase PostgreSQL** + `pgvector` HNSW indexes + Row Level Security                                    |
| **Document Export Engine**      | **`@react-pdf/renderer`** (ISO 19005-1 PDF/A-1b & Designer PDF) + **`docx`** (Word)                       |
| **Access Model**                | **100% Free & Open Community Access**                                                                     |

---

## 🌟 Transcendent Tier Innovations

### 1. 🪄 Direct-Canvas Ghost-AI

Directly click any bullet on the interactive paper canvas to invoke a floating magic wand. Previews purple ghost-text diff replacements in-place with floating `+3 pts` score burst particle micro-animations upon acceptance.

### 2. ⏱️ 6-Second Recruiter Challenge

Simulates the initial 6.0-second visual scan performed by human hiring managers. Features an interactive **F-Pattern Fixation Heatmap** (`Zone 1 ➔ Zone 2 ➔ Zone 3 ➔ Zone 4`), live gaze reticle animation, and instant 1st-round phone screen verdict generation.

### 3. 🏛️ FAANG Cultural Principle Rubrics

Benchmarks resume accomplishments directly against corporate evaluation frameworks:

- **Google**: Googleyness, General Cognitive Ability (GCA), and Role-Related Knowledge (RRK).
- **Amazon**: Customer Obsession, Ownership, Bias for Action, Deliver Results (16 Leadership Principles).
- **Stripe**: Macro Focus, Craftsmanship, Speed, and Rigor.
- **Apple**: Simplicity, Secrecy, Extreme Craft, and Deep Integration.
- **Meta**: Move Fast, Live in the Future, and Direct Impact.
- **OpenAI**: Frontier Alignment, Iterative Deployment, and Scalability.

### 4. 🚀 Pre-Flight Launchpad Auditor

An exhaustive 6-point pre-submission flight scanner verifying formatting integrity, contact discoverability, action verb densities, metric quantification, and ATS blocker prevention. Generates a public, verifiable cryptographic QR badge (`RL-9842-VERIFIED`).

### 5. 🛡️ Multi-LLM Fallback & Self-Healing Circuit Breaker

Sub-1.5s non-blocking resilience engine. If the primary AI provider experiences rate limits or network degradation, it seamlessly falls back through **Gemini 3.5 Flash ➔ Claude 3.5 Haiku ➔ GPT-4o-mini ➔ Deterministic Offline Heuristics** with zero UI interruption.

---

## 💎 Masterclass 6-Pillar Suite

- **🎛️ Multi-Format Export Command Station**: 1-Click exports for **ISO 19005-1 ATS-Certified PDF/A-1b**, **Modern Executive Designer PDF**, **Clean Single-Column Word DOCX**, and **LinkedIn Profile Bridge**.
- **🎙️ AI STAR Interview Coach & Question Predictor**: Predicts likely recruiter behavioral questions from your bullets, formats 4-part **STAR talking points** (Situation, Task, Action, Result), warns against interviewer traps, and includes a built-in 90-second speech practice timer.
- **🎯 Target ATS Vendor Fingerprinting**: Reverse-engineered parsing rules and failure mode warnings for **Greenhouse, Lever, Workday, Ashby, and Taleo**.
- **🧘 Zen Review Darkroom Mode**: Fullscreen, distraction-free OLED workspace designed for deep focus, interview prep, and live candidate coaching.
- **🎓 Skill Bridges**: Instant 1-click certification roadmaps and 1-weekend portfolio project blueprints for detected missing skills.
- **🔊 Sound FX & Micro-Haptics**: Synthesizes tactile mechanical clicks, rising success chords, and 90+ score milestone fanfares with universal navbar/sidebar audio controls.

---

## 📁 Repository Structure

```
resumelens/
├── src/
│   ├── app/
│   │   ├── api/                     ← 25+ Edge & Node.js API endpoints
│   │   │   ├── analyze/             ← Gemini AI analysis engine
│   │   │   ├── fix-resume/          ← Executive rewrite engine
│   │   │   ├── interviews/          ← STAR interview simulator
│   │   │   └── ext/                 ← Chrome Extension API bridge
│   │   ├── dashboard/               ← 13-module executive portal
│   │   │   ├── ab-testing/          ← Dual resume variant split testing
│   │   │   ├── analytics/           ← 120 FPS conversion funnels & trends
│   │   │   ├── applications/        ← Interactive Kanban application tracker
│   │   │   ├── builder/             ← Notion-style slash command resume editor
│   │   │   ├── compare/             ← Off-thread LCS word-level diff viewer
│   │   │   ├── negotiator/          ← Salary counter-offer simulator
│   │   │   └── page.tsx             ← Transcendent AI Command Suite hub
│   │   ├── layout.tsx               ← Global metadata, fonts, sound providers
│   │   └── page.tsx                 ← Interactive landing page & analysis sandbox
│   ├── components/                  ← 45+ modular UI components & modals
│   │   ├── DirectCanvasGhostAi.tsx  ← Inline click-to-polish magic wand
│   │   ├── SixSecondRecruiterSimulator.tsx ← 6s eye-tracking gaze challenge
│   │   ├── StarInterviewCoachModal.tsx ← STAR interview talking points & timer
│   │   ├── ExportStationModal.tsx   ← Multi-format PDF/A & DOCX export deck
│   │   ├── PreFlightLaunchpadModal.tsx ← 6-point pre-submission scanner
│   │   ├── CompanyCultureBenchmarkModal.tsx ← FAANG rubric comparator
│   │   └── ResultsPanel/            ← Apple/Linear style Bento analysis dashboard
│   ├── hooks/                       ← SWR data management & chart hooks
│   ├── lib/
│   │   ├── ai/                      ← Gemini models, STAR engine, multi-LLM chain
│   │   ├── pdf/                     ← PDF/A-1b & Designer PDF generators
│   │   ├── docxExport.ts            ← Word document builder
│   │   ├── soundFx.ts               ← Web Audio harmonic waveform synthesizer
│   │   └── parseResume.ts           ← Off-thread parsing engine
│   └── types/                       ← Strict TypeScript schemas & definitions
├── supabase/
│   └── migrations/                  ← Versioned PostgreSQL & pgvector schemas
├── chrome-extension/                ← Browser extension for 1-click job clipping
└── tools/                           ← Developer CLI scripts & embeddings backfillers
```

---

## 🛠️ Local Development

### 1. Clone & Install

```bash
git clone https://github.com/Medgabsi99/resumelens.git
cd resumelens
npm install --legacy-peer-deps
cp .env.local.example .env.local
```

### 2. Environment Configuration

Populate `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini AI
GOOGLE_AI_API_KEY=your-gemini-api-key

# Distributed Rate Limiting & Caching (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-upstash-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Use global keyboard shortcuts:

- `g + d` — Navigate to Dashboard
- `g + y` — Navigate to Analytics
- `g + b` — Navigate to A/B Testing
- `[` — Toggle Sidebar
- `?` — Keyboard Shortcuts Palette

---

## 🧪 Automated Testing & Verification

Run the entire test suite covering all Transcendent innovations, parsers, security filters, and PDF generators:

```bash
# Run 131 automated unit tests
npm test

# Type-check TypeScript with 0 errors
npx tsc --noEmit

# Run ESLint
npm run lint

# Build production bundle (74 static & dynamic routes)
npm run build
```

---

## 📜 License

Private & Proprietary. All rights reserved.
