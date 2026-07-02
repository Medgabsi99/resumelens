# ResumeLens — Database Migrations

All schema changes for ResumeLens live here as numbered SQL files.
**`supabase/migrations/` is the single source of truth for the database schema.**

## Running Migrations

Paste each file into the **Supabase Dashboard → SQL Editor → New Query → Run**
in the order shown below. All statements use `IF NOT EXISTS` / `OR REPLACE`
so they are safe to re-run against an existing database.

## Migration Order

| File | Description |
|------|-------------|
| `20240601000001_profiles.sql` | `profiles` table, `handle_new_user` trigger, `increment_analyses_used` function |
| `20240601000002_analyses.sql` | `analyses` table (score, result_json, resume_text, job_description) |
| `20240601000003_resumes.sql` | `resumes` library table + `updated_at` trigger |
| `20240601000004_job_matches_applications_versions_portfolios.sql` | `job_matches`, `applications` tracker (+ trigger), `resume_versions`, `user_portfolios` |
| `20240601000005_ai_features.sql` | `salary_negotiations`, `learning_paths`, `mock_interviews` |
| `20240625_pgvector_resume_chunks.sql` | `vector` extension, `resume_chunks` table, HNSW + GIN indexes, hybrid BM25+dense search functions (`match_resume_chunks`, `match_resume_chunks_hybrid`) |

> **Note:** The pgvector migration (`20240625_*`) must run **after** 001–005 because
> `resume_chunks` has foreign keys to both `analyses` and `resumes`.

## Schema Overview

```
auth.users  (Supabase managed)
    │
    ├── profiles              — plan, usage counter, Stripe customer ID
    ├── analyses              — ATS scan results (score, result_json)
    ├── resumes               — saved resume library
    │       └── resume_chunks — pgvector embeddings + BM25 tsvector (hybrid RAG)
    ├── resume_versions       — git-style snapshots linked to an analysis
    ├── job_matches           — resume ↔ job description match results
    ├── applications          — job application kanban tracker
    ├── user_portfolios       — generated portfolio pages (theme + JSONB content)
    ├── salary_negotiations   — AI negotiation simulator sessions
    ├── learning_paths        — personalised skill gap roadmaps
    └── mock_interviews       — STAR-method interview practice sessions
```

## RLS Policy Summary

Every table uses Supabase Row-Level Security. The standard pattern applied
consistently across all tables is:

| Operation | Who |
|-----------|-----|
| SELECT | `auth.uid() = user_id` |
| INSERT | `auth.uid() = user_id` |
| UPDATE (where applicable) | `auth.uid() = user_id` |
| DELETE | `auth.uid() = user_id` |
| ALL | `auth.role() = 'service_role'` (for server-side API routes + webhooks) |

## Adding New Migrations

Use the naming convention: `YYYYMMDDHHMMSS_short_description.sql`

Example: `20260702120000_add_notifications_table.sql`
