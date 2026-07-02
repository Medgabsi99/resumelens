# tools/

One-off developer utilities that don't belong in the main app bundle.

| File | Purpose | When to use |
|---|---|---|
| `download-ttf.mjs` | Downloads font TTF files to `public/fonts/` from Google Fonts | `node tools/download-ttf.mjs` — run once after cloning or when adding typefaces |
| `create-bucket.ps1` | Creates the `pdfs` Supabase Storage bucket via REST API | `.\tools\create-bucket.ps1` — run once per fresh Supabase project; requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars |
