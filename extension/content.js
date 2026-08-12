/**
 * ResumeLens Chrome Extension Content Script
 * Scrapes Job Title, Company, Location, & Description from LinkedIn, Indeed, Glassdoor, & ZipRecruiter.
 */

function extractJobDetails() {
  const host = window.location.hostname;
  const url = window.location.href;

  let jobTitle = "";
  let companyName = "";
  let location = "";
  let salary = "";
  let jobDescription = "";
  let source = "Web Page";

  // ── 1. LINKEDIN ─────────────────────────────────────────────────────────────
  if (host.includes("linkedin.com")) {
    source = "LinkedIn";

    // Title
    const titleEl = document.querySelector(
      ".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, .top-card-layout__title, h1.t-24"
    );
    if (titleEl) jobTitle = titleEl.innerText.trim();

    // Company
    const compEl = document.querySelector(
      ".job-details-jobs-unified-top-card__primary-description a, .jobs-unified-top-card__company-name, .topcard__flavor--black-link"
    );
    if (compEl) companyName = compEl.innerText.trim();

    // Location
    const locEl = document.querySelector(
      ".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet, .topcard__flavor--bullet"
    );
    if (locEl) location = locEl.innerText.trim();

    // Description
    const descEl = document.querySelector(
      "#job-details, .jobs-description__content, .description__text"
    );
    if (descEl) jobDescription = descEl.innerText.trim();
  }

  // ── 2. INDEED ──────────────────────────────────────────────────────────────
  else if (host.includes("indeed.com")) {
    source = "Indeed";

    const titleEl = document.querySelector(
      "h1.jobsearch-JobInfoHeader-title, .jobsearch-JobInfoHeader-title span"
    );
    if (titleEl) jobTitle = titleEl.innerText.trim();

    const compEl = document.querySelector(
      "[data-company-name='true'], .jobsearch-InlineCompanyRating div"
    );
    if (compEl) companyName = compEl.innerText.trim();

    const locEl = document.querySelector(
      "[data-testid='inline-header-location'], .jobsearch-JobInfoHeader-companyLocation"
    );
    if (locEl) location = locEl.innerText.trim();

    const descEl = document.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText");
    if (descEl) jobDescription = descEl.innerText.trim();
  }

  // ── 3. GLASSDOOR ───────────────────────────────────────────────────────────
  else if (host.includes("glassdoor.com")) {
    source = "Glassdoor";

    const titleEl = document.querySelector("[data-test='jobTitle'], .JobDetails_jobTitle__g2_4c");
    if (titleEl) jobTitle = titleEl.innerText.trim();

    const compEl = document.querySelector(
      "[data-test='employerName'], .EmployerProfile_employerName__N_v_0"
    );
    if (compEl) companyName = compEl.innerText.trim();

    const locEl = document.querySelector("[data-test='location']");
    if (locEl) location = locEl.innerText.trim();

    const descEl = document.querySelector(
      ".JobDetails_jobDescription__2L0vB, #JobDescriptionContainer"
    );
    if (descEl) jobDescription = descEl.innerText.trim();
  }

  // ── 4. GENERIC FALLBACK ───────────────────────────────────────────────────
  if (!jobTitle) {
    jobTitle =
      document.title.replace(/(?:-|||@|at).*/i, "").trim() || document.title || "Job Posting";
  }

  if (!jobDescription || jobDescription.length < 10) {
    const mainArticle = document.querySelector("article, main, #content, .description, body");
    if (mainArticle) {
      jobDescription = mainArticle.innerText.trim().slice(0, 5000);
    }
  }

  if (!jobDescription) {
    jobDescription = `Job position: ${jobTitle} at ${companyName || "Company"}. Clipped from ${url}`;
  }

  return {
    jobTitle: jobTitle || "Job Posting",
    companyName: companyName || "Company",
    location: location || "Remote / Hybrid",
    salary: salary || "",
    jobDescription,
    jobUrl: url,
    source,
  };
}

// Listen for messages from extension popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_job") {
    const details = extractJobDetails();
    sendResponse({ success: true, details });
  }
  return true;
});
