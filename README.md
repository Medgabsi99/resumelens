# ResumeLens — AI Resume Reviewer

A feature-rich Next.js workspace that gives honest, structured AI feedback on resumes. Built with Google Gemini, Supabase Auth, and Stripe payments.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| AI | Google Gemini 3.5 Flash (via `@google/generative-ai`) |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | Supabase (Postgres + RLS) |
| Payments | Stripe Checkout + Webhooks |
| File parsing | `pdf-parse` (PDF), `mammoth` (DOCX) |
| Hosting | Vercel (recommended) |

## Features

- **Resume upload** — drag-and-drop PDF, DOCX, or TXT, or paste plain text
- **AI analysis** — score (1–100), summary, strengths, weaknesses, 3 rewrite suggestions
- **Keyword gap analysis** — matched vs. missing JD keywords (when JD is provided)
- **Auth** — email/password + Google OAuth via Supabase
- **Quota system** — free tier: 2 analyses; paid tiers: unlimited
- **Stripe paywall** — $9 one-time or $19/month; modal shown when free quota is exhausted
- **Dashboard** — history of past analyses with scores
- **Stripe webhooks** — auto-upgrades/downgrades user plan on payment events

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd resumelens
npm install
cp .env.local.example .env.local
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase-migrations.sql`
3. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **Authentication → Providers** and enable **Google** (add your OAuth client ID/secret from Google Cloud Console)

### 3. Set up Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Go to **Products** → create two products:
   - **ResumeLens Lifetime** — one-time price of $9.00
   - **ResumeLens Pro** — recurring price of $19.00/month
3. Copy price IDs to `.env.local`
4. Get your **Secret key** and **Publishable key** from the Dashboard
5. For webhooks (local): install Stripe CLI and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   Copy the `whsec_...` secret to `STRIPE_WEBHOOK_SECRET`

### 4. Get Google Gemini API key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Create an API key → paste into `GOOGLE_AI_API_KEY`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment to Vercel

```bash
npm install -g vercel
vercel
```

Add all environment variables from `.env.local` in the Vercel dashboard under **Settings → Environment Variables**.

### Stripe webhook for production

1. Go to Stripe Dashboard → **Webhooks → Add endpoint**
2. URL: `https://yourdomain.com/api/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the signing secret → update `STRIPE_WEBHOOK_SECRET`

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       ← Core AI analysis endpoint
│   │   ├── create-checkout/route.ts ← Stripe checkout session
│   │   └── webhook/route.ts       ← Stripe webhook handler
│   ├── auth/callback/route.ts     ← Supabase OAuth callback
│   ├── dashboard/page.tsx         ← User dashboard
│   ├── login/page.tsx             ← Auth page
│   ├── pricing/page.tsx           ← Pricing page
│   └── page.tsx                   ← Main reviewer UI
├── components/
│   ├── ResultsPanel.tsx           ← Full analysis display
│   └── UpgradeModal.tsx           ← Paywall modal
├── lib/
│   ├── ai.ts                      ← Gemini API + file parsing
│   ├── auth.ts                    ← Session helpers
│   ├── stripe.ts                  ← Stripe client + plan config
│   └── supabase.ts               ← Supabase clients
└── types/index.ts                 ← Shared TypeScript types
```

---

## Customization

### Change the AI prompt
Edit `src/lib/ai.ts` → `buildAnalysisPrompt()`. The prompt is the core product — tweak the scoring rubric, add more suggestion sections, or request additional JSON fields.

### Change plan limits
Edit `src/lib/stripe.ts` → `PLAN_LIMITS`. Currently: `free: 2`, `one_time: 999`, `monthly: 999`.

### Change prices
Update price IDs in `.env.local` and the display amounts in `src/app/pricing/page.tsx`.

---

## Getting your first users

1. Share on LinkedIn with a before/after example (your own resume)
2. Post in job seeker communities (r/jobs, r/cscareerquestions)
3. List on Product Hunt
4. Offer free lifetime access to the first 10 users in exchange for feedback

The single best thing you can do: film a 60-second Loom of the product in action and post it.

---

## Security & Dependency Status

`npm audit` reports advisories against the pinned `next@^14.2.0` range. Below is the precise triage — most do **not** apply to this deployment configuration.

| Advisory | Applies? | Mitigation |
|---|---|---|
| HTTP request smuggling in rewrites | ❌ No | No `rewrites:` in `next.config.js` |
| SSRF via WebSocket upgrades | ❌ No | WebSockets connect directly to Supabase from the browser, not proxied via Next |
| XSS via CSP nonces | ❌ No | CSP uses `unsafe-inline`; no nonces configured |
| XSS in `beforeInteractive` scripts | ❌ No | No `next/script` with `beforeInteractive` in codebase |
| Middleware i18n bypass | ❌ No | No i18n config; App Router only |
| Image Optimizer DoS | ✅ Mitigated | `images: { unoptimized: true }` in `next.config.js` disables `/_next/image` |
| Middleware cache poisoning | ✅ Mitigated | Vercel's CDN edge applies cache-key isolation per Next.js team guidance for Vercel-hosted deployments |
| RSC cache poisoning | ✅ Mitigated | Same Vercel CDN-layer mitigation |
| `glob`/`minimatch`/`postcss` advisories | ✅ N/A | devDependencies — not shipped to production |

> [!NOTE]
> **Deployment status:** Safe to deploy on Vercel with the current configuration. The full Next.js 15/16 migration (which resolves all advisories unconditionally) is tracked as a future improvement. The async-request breaking changes in Next 15 require a dedicated migration session.



