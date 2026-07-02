# tools/

One-off developer utilities that don't belong in the main app bundle.

| File | Purpose | When to use |
|---|---|---|
| `download-ttf.mjs` | Downloads font TTF files to `public/fonts/` from Google Fonts | Run once after cloning, or when adding new typefaces: `node tools/download-ttf.mjs` |
| `create-bucket.ps1` | Creates the `pdfs` Supabase Storage bucket via REST API | Run once per Supabase project on a fresh environment — requires the service-role key set in the script ⚠️ |

> **Security note:** `create-bucket.ps1` contains a Supabase service-role JWT. Do **not** commit real keys — replace with `$env:SUPABASE_SERVICE_ROLE_KEY` and load from `.env.local` before sharing this repo publicly.
