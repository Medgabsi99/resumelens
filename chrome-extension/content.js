function scrapeJobDetails() {
  const url = window.location.href;
  let jobTitle = "";
  let companyName = "";
  let jobDescription = "";

  if (url.includes("linkedin.com")) {
    // LinkedIn Selectors
    jobTitle = document.querySelector(".job-details-jobs-unified-top-card__job-title, .jobs-details__main-content h1, h1")?.innerText || "";
    companyName = document.querySelector(".job-details-jobs-unified-top-card__company-name, .jobs-details__top-card-org-name, .jobs-unified-top-card__company-name")?.innerText || "";
    jobDescription = document.querySelector(".jobs-description__content, #job-details")?.innerText || "";
  } else if (url.includes("indeed.com")) {
    // Indeed Selectors
    jobTitle = document.querySelector(".jobsearch-JobInfoHeader-title, h1")?.innerText || "";
    companyName = document.querySelector(".jobsearch-CompanyInfoWithoutHeaderImage, [data-company-name]")?.innerText || "";
    jobDescription = document.querySelector("#jobDescriptionText")?.innerText || "";
  } else if (url.includes("greenhouse.io")) {
    // Greenhouse Selectors
    jobTitle = document.querySelector(".header-header h1, .app-title, h1")?.innerText || "";
    companyName = document.querySelector(".company-name")?.innerText || "";
    jobDescription = document.querySelector("#content")?.innerText || "";
  } else if (url.includes("lever.co")) {
    // Lever Selectors
    jobTitle = document.querySelector(".posting-header h2, h1")?.innerText || "";
    companyName = document.querySelector(".posting-header .logo, .posting-header")?.innerText || "";
    if (companyName) {
      companyName = companyName.split("\n")[0].trim();
    }
    jobDescription = document.querySelector(".section.page-centered")?.innerText || "";
  }

  // Clean company name from extra noise (like rating stars or "at")
  if (companyName) {
    companyName = companyName.split("\n")[0].split("•")[0].replace(/at\s+/i, "").trim();
  }

  // Fallback heuristic selectors
  if (!jobTitle) {
    jobTitle = document.title.split(" - ")[0].split(" | ")[0].trim();
  }
  if (!companyName) {
    const titleParts = document.title.split(" at ");
    if (titleParts.length > 1) {
      companyName = titleParts[1].split(" - ")[0].split(" | ")[0].trim();
    }
  }
  if (!jobDescription) {
    const mainContent = document.querySelector("main, article, #content, .job-description, .job-details");
    jobDescription = mainContent?.innerText || document.body.innerText;
  }

  // Clean strings
  jobTitle = jobTitle.trim().replace(/\s+/g, " ");
  companyName = companyName.trim().replace(/\s+/g, " ");
  jobDescription = jobDescription.trim();

  if (jobDescription.length > 8000) {
    jobDescription = jobDescription.slice(0, 8000) + "\n\n[Truncated for length]";
  }

  return {
    jobTitle,
    companyName,
    jobDescription,
    jobUrl: url,
  };
}

scrapeJobDetails();
