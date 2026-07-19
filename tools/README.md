# tools/

One-off developer utilities that don't belong in the main app bundle.

| File | Purpose | When to use |
|---|---|---|
| `download-ttf.mjs` | Downloads font TTF files to `public/fonts/` from Google Fonts | `node tools/download-ttf.mjs` — run once after cloning or when adding typefaces |
| `create-bucket.ps1` | Creates the `pdfs` Supabase Storage bucket via REST API | `.\tools\create-bucket.ps1` — run once per fresh Supabase project; requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars |
| `backfill-embeddings.mjs` | Re-embeds all `resume_chunks` rows with the current gemini-2.5 embedding model | `node --env-file=.env.local tools/backfill-embeddings.mjs` for a dry-run count, add `--yes` to actually re-embed. Run once after switching embedding models (e.g. the `text-embedding-004` → `gemini-2.5-embedding-001` migration) — old rows are dimensionally valid but semantically incompatible with new ones. Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_AI_API_KEY` |