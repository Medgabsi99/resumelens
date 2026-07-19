# ResumeLens — AI Resume Reviewer

A premium, modern Next.js workspace that provides honest, structured AI feedback on resumes, A/B variant testing, and aggregate job-search analytics. Built with React 19, Next.js 16, Google Gemini APIs, Supabase Auth, and Stripe payments.

## Stack & Architecture

| Layer | Technology |
|---|---|
| Framework | **Next.js 16.2.10 (App Router, Turbopack)** |
| Rendering | **React 19.0.0 (Stable)** |
| Styling | **Vanilla CSS + CSS Variables** (Premium Slate & Ember theme on warm paper) |
| Animations | **Framer Motion** (Spring transitions, Kanban stagger animations) |
| AI Integration | **Google Gemini 2.5** (via `@google/generative-ai`) |
| Auth & DB | **Supabase Auth** (Email + Google OAuth) & **Supabase Database** (PostgreSQL + RLS) |
| Payments | **Stripe Checkout + Webhooks** |
| File Parsing | `pdf-parse` (PDF) & `mammoth` (DOCX) |
| Hosting | **Vercel** (recommended) |

---

## Core Features

- **Resume Upload & Parsing** — Drag-and-drop PDF, DOCX, or TXT formats, or paste plain text. Reads text dynamically in the browser sandbox.
- **ATS Scorecard Analysis** — Generates score (1–100), overall evaluation summary, core strengths, weaknesses, and three actionable rewrite suggestions.
- **Inline Keyword Highlighting** — A Jobscan-style contextual scan. Wraps matching job description keywords in highlighted amber `<mark>` elements inside the resume. Displays missing keywords as interactive ghost chips with context-aware placement hints.
- **A/B Resume Testing** — Lets users contrast two resume versions side-by-side against a target job description. Recommends which version is better positioned and explains why based on ATS score and keyword matching.
- **Aggregate Analytics Dashboard** — Tracks job search data and performance over time:
  - **ATS Score Trend**: Interactive SVG polyline chart showing historical progress with a rolling 4-point average trendline.
  - **Best Score by Role**: Horizontal bar charts comparing resume scores across target job categories.
  - **Application Conversion**: Renders application funnel stats (Applied → Screening → Interviewing → Hired) and calculates conversion KPIs.
- **Job Application Tracker** — Interactive Kanban pipeline board to organize job opportunities with modal dialogs and smooth spring layout transitions.
- **Salary Negotiator Coach** — Conversational AI recruiter simulator with custom tactics checklist tracking, speech synthesis suggestions, and scorecards.
- **Auth & Payments Gateways** — Supabase authentication paired with a Stripe product paywall. Limits free tier to 2 analyses, showing a subscription dialog when exhausted.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts         ← Core Gemini API analysis endpoint
│   │   ├── create-checkout/route.ts   ← Stripe checkout session
│   │   └── webhook/route.ts         ← Stripe webhook payment events
│   ├── dashboard/
│   │   ├── ab-testing/page.tsx      ← A/B comparison page
│   │   ├── analytics/page.tsx       ← Performance metrics page
│   │   ├── DashboardStatsGrid.tsx   ← Modular KPI cards
│   │   ├── DashboardCharts.tsx      ← SVG progress & funnel widgets
│   │   ├── DashboardActivityTabs.tsx ← Activity logs, tables, search
│   │   └── page.tsx                 ← Dashboard orchestrator shell
│   ├── login/page.tsx               ← Auth gateway
│   ├── pricing/page.tsx             ← Pricing page
│   └── page.tsx                     ← Main landing page and sandbox
├── components/
│   ├── ResultsPanel/
│   │   ├── KeywordHighlighter.tsx   ← Longest-match regex inline text highlighter
│   │   └── index.tsx                ← Full review scorecard panel
│   ├── ResumeEditor/
│   │   ├── EditorHistorySidebar.tsx ← Draft revision timelines
│   │   └── index.tsx                ← Main resume sandbox editor component
│   ├── SalaryNegotiatorBoard/
│   │   ├── NegotiatorScorecardModal.tsx ← Simulator game outcomes scorecard
│   │   └── index.tsx                ← Live simulator interactive panel
│   └── DashboardLayout.tsx          ← Dashboard navigation shell & shortcuts
├── lib/
│   ├── ai/                          ← Gemini models, prompt context, embeddings
│   ├── stripe.ts                    ← Plan definitions and billing clients
│   └── supabase.ts                  ← Supabase database clients
└── types/index.ts                   ← Shared TypeScript definitions
```

---

## Local Setup

### 1. Clone and Install dependencies

```bash
git clone <your-repo>
cd resumelens
npm install --legacy-peer-deps
cp .env.local.example .env.local
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the contents of `supabase-migrations.sql` to initialize tables, PGVector, indexes, and RLS policies.
3. Under **Settings → API**, copy credentials to `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Enable **Google** provider under **Authentication → Providers** (register Google Client ID/secret).

### 3. Set up Stripe

1. Create an account at [stripe.com](https://stripe.com).
2. Create two products under **Products**:
   - **ResumeLens Lifetime** — one-time purchase ($9.00)
   - **ResumeLens Pro** — monthly recurring plan ($19.00)
3. Copy Stripe Publishable key, Secret key, and Price IDs into `.env.local`.
4. Install Stripe CLI and listen locally to route events:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   Save the output signing key to `STRIPE_WEBHOOK_SECRET`.

### 4. Configure Google Gemini

1. Visit [aistudio.google.com](https://aistudio.google.com).
2. Obtain a Gemini API key and set it as `GOOGLE_AI_API_KEY` in `.env.local`.

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Keyboard shortcuts like `g + d` (Dashboard), `g + y` (Analytics), and `g + b` (A/B Testing) can be used to quickly navigate around.

---

## Customization

### Change the AI prompt
Edit `src/lib/ai.ts` -> `buildAnalysisPrompt()`. Tweak the scoring rubrics, target keyword densities, and feedback guidelines.

### Change billing plan limits
Edit `src/lib/stripe.ts` -> `PLAN_LIMITS`. Adjust the analysis quota thresholds for free, lifetime, and monthly subscriptions.

---

## Production Deployment

This workspace compiles cleanly using Next.js Turbopack for production:

```bash
npm run build
```

Deploying to Vercel is recommended. Add all environment variables listed in `.env.local` to the Vercel dashboard and point your Stripe live webhook endpoint to `https://yourdomain.com/api/webhook`.
