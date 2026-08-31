# 🚀 ResumeLens Studio Chrome Extension (Manifest V3)

The ultimate 1-click ATS Match Studio, Job Scraper, and Recruiter Outreach Generator for Google Chrome and Microsoft Edge.

---

## 🌟 Supported Job Platforms

- 💼 **LinkedIn** (`linkedin.com/jobs/*`) — Full JSON-LD + BEM structure parser
- 🔍 **Indeed** (`indeed.com/viewjob/*`) — High-precision title & description extractor
- 🏢 **Glassdoor** (`glassdoor.com/job-listing/*`) — Job description & salary range parser
- ⚡ **ZipRecruiter** (`ziprecruiter.com/jobs/*`) — Full role & requirements parser
- 🌱 **Greenhouse** (`greenhouse.io/*`) — ATS posting reader
- 🎯 **Lever** (`lever.co/*`) — Clean posting container extractor
- 🦄 **Ashby** (`ashbyhq.com/*`) — Modern SPA posting extractor
- 🏢 **Workday** (`myworkdayjobs.com/*`) — Enterprise job posting reader
- 🎲 **Dice** (`dice.com/*`) — Tech job listing parser
- 🚀 **Wellfound / AngelList** (`wellfound.com/*`) — Startup job listing parser
- 🌐 **Any Company Career Page** — Semantic heuristic fallback

---

## ✨ Features

1. **Live ATS Match Calculator**: Computes match percentage and missing keywords instantly against your active resume (`/api/ext/match`).
2. **Resume Library Sync**: Choose between your saved ResumeLens resumes directly from the popup (`/api/ext/resumes`).
3. **AI Cold Outreach Generator**: Generates personalized LinkedIn connection notes and recruiter emails with 1-click copy (`/api/ext/outreach`).
4. **1-Click Application Tracker**: Automatically syncs the job into your ResumeLens Kanban Pipeline (`/api/ext/apply`).
5. **AI Bullet Tailor**: Generates tailored bullet points incorporating missing keywords on the fly (`/api/ext/tailor`).

---

## 🛠️ How to Install & Load (Developer Mode)

1. Open Google Chrome or Brave/Edge and navigate to `chrome://extensions/`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `chrome-extension/` folder from your local `resumelens` repository.
5. Pin the **ResumeLens** extension to your toolbar.
6. Open any job on LinkedIn, Indeed, Glassdoor, or Greenhouse and click the extension!
