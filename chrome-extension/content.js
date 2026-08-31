function scrapeJobDetails() {
  const url = window.location.href;
  let jobTitle = "";
  let companyName = "";
  let jobDescription = "";

  if (url.includes("linkedin.com")) {
    // 1. Locate Job Title
    const titleSelectors = [
      ".job-details-jobs-unified-top-card__job-title h1",
      "h1.job-details-jobs-unified-top-card__job-title",
      ".jobs-unified-top-card__job-title h1",
      ".job-details-jobs-unified-top-card__job-title",
      ".jobs-search__job-details h1",
      "h1.t-24",
      "h2.top-card-layout__title",
      "h1.topcard__title",
      ".jobs-details h1",
      "h1",
    ];
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim()) {
        jobTitle = el.innerText.trim();
        break;
      }
    }

    // 2. Locate Company Name
    const companySelectors = [
      ".job-details-jobs-unified-top-card__company-name a",
      ".jobs-unified-top-card__company-name a",
      ".job-details-jobs-unified-top-card__company-name",
      ".jobs-unified-top-card__company-name",
      ".jobs-search__job-details .topcard__org-name-link",
      ".topcard__org-name-link",
      ".jobs-details a[href*='/company/']",
      "a[href*='linkedin.com/company/']",
      "a[href*='/company/']",
    ];
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim()) {
        companyName = el.innerText.trim();
        break;
      }
    }

    // 3. Locate Job Description - Try Exact Selectors First
    const specificDescSelectors = [
      "#job-details",
      "#job-details span",
      ".jobs-description__content .show-more-less-html__markup",
      ".jobs-description-content__text",
      ".jobs-box__html-content",
      ".jobs-description__content",
      ".jobs-description .show-more-less-html__markup",
      ".show-more-less-html__markup",
      "article.jobs-description__container",
      ".jobs-description__container",
      ".jobs-description",
    ];

    let bestDesc = "";
    for (const sel of specificDescSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const txt = (el.innerText || el.textContent || "").trim();
        if (txt.length > bestDesc.length && txt.length > 30) {
          bestDesc = txt;
        }
      }
    }

    // Fallback: Search all page containers, strictly ignoring the left search results rail
    if (!bestDesc) {
      const allContainers = document.querySelectorAll("article, section, div, main");

      const searchMarkers = [
        "jobs that match your profile",
        "based on your profile and the job criteria",
        "how promoted jobs are ranked",
        "are these results helpful",
        "offres correspondant",
      ];

      for (const el of allContainers) {
        // Structural rejection based on standard LinkedIn layout names
        if (
          el.matches("[class*='search-results'], [class*='left-rail'], [class*='list-container']")
        )
          continue;
        if (
          el.querySelector(
            "[class*='search-results'], [class*='left-rail'], [class*='list-container']"
          )
        )
          continue;

        const txt = (el.innerText || "").trim();
        if (!txt) continue;

        // Lexical rejection: if a container includes these strings, it is (or wraps) the search list
        const txtLower = txt.toLowerCase();
        const isSearchList = searchMarkers.some((marker) => txtLower.includes(marker));
        if (isSearchList) continue;

        // Pick the container with the most text
        if (txt.length > bestDesc.length && txt.length > 50 && txt.length < 35000) {
          bestDesc = txt;
        }
      }
    }

    if (bestDesc) {
      jobDescription = bestDesc;
    }

    // 4. JSON-LD fallback for standalone pages
    if (!jobDescription) {
      try {
        const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of ldScripts) {
          const json = JSON.parse(script.textContent);
          const posting =
            json["@type"] === "JobPosting"
              ? json
              : Array.isArray(json["@graph"])
                ? json["@graph"].find((n) => n["@type"] === "JobPosting")
                : null;

          if (posting && posting.description) {
            if (!jobTitle) jobTitle = posting.title || "";
            if (!companyName) companyName = posting.hiringOrganization?.name || "";
            const tmp = document.createElement("div");
            tmp.innerHTML = posting.description || "";
            jobDescription = tmp.innerText.trim();
            break;
          }
        }
      } catch (_) {}
    }

    // 5. Clean header cards and trailing marketing footers
    if (jobDescription) {
      const startMarkers = [
        "About the job",
        "About this job",
        "About the role",
        "About this role",
        "About this position",
        "Job description",
        "Role overview",
        "Position overview",
        "Description du poste",
        "À propos du poste",
        "À propos de l'offre d'emploi",
        "À propos de l'offre",
        "Profil recherché",
        "Descriptif du poste",
        "A propos de l'offre",
      ];
      for (const marker of startMarkers) {
        const idx = jobDescription.toLowerCase().indexOf(marker.toLowerCase());
        if (idx !== -1 && idx < 1200) {
          jobDescription = jobDescription.slice(idx + marker.length).trim();
          break;
        }
      }

      jobDescription = jobDescription
        .replace(/\n\s*Job search faster with Premium[\s\S]*$/i, "")
        .replace(/\n\s*Access company insights[\s\S]*$/i, "")
        .replace(/\n\s*Your feedback helps us improve[\s\S]*$/i, "")
        .replace(/\n\s*LinkedIn Corporation ©[\s\S]*$/i)
        .trim();
    }
  } else if (url.includes("indeed.com")) {
    // Indeed Selectors
    jobTitle = document.querySelector(".jobsearch-JobInfoHeader-title, h1")?.innerText || "";
    companyName =
      document.querySelector(".jobsearch-CompanyInfoWithoutHeaderImage, [data-company-name]")
        ?.innerText || "";
    jobDescription = document.querySelector("#jobDescriptionText")?.innerText || "";
  } else if (url.includes("glassdoor.com")) {
    // Glassdoor Selectors
    jobTitle =
      document.querySelector("[data-test='jobTitle'], .JobDetails_jobTitle__g2_4c, h1")
        ?.innerText || "";
    companyName =
      document.querySelector(
        "[data-test='employerName'], .EmployerProfile_employerName__N_v_0, .employer-name"
      )?.innerText || "";
    jobDescription =
      document.querySelector(".JobDetails_jobDescription__2L0vB, #JobDescriptionContainer, .desc")
        ?.innerText || "";
  } else if (url.includes("ziprecruiter.com")) {
    // ZipRecruiter Selectors
    jobTitle = document.querySelector("h1.job_title, h1.text-primary, h1")?.innerText || "";
    companyName =
      document.querySelector(".hiring_company_text, .job_company, a.company_name")?.innerText || "";
    jobDescription =
      document.querySelector(".job_description, .jobDescriptionSection, #job_desc")?.innerText ||
      "";
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
  } else if (url.includes("ashbyhq.com")) {
    // Ashby Selectors
    jobTitle = document.querySelector("h1, [class*='heading'], [class*='title']")?.innerText || "";
    companyName =
      document.querySelector("[class*='company'], [class*='header'] a")?.innerText || "";
    jobDescription =
      document.querySelector("[class*='description'], [class*='jobDescription'], [class*='body']")
        ?.innerText || "";
  } else if (url.includes("myworkdayjobs.com") || url.includes("workday.com")) {
    // Workday Selectors
    jobTitle =
      document.querySelector("h2[data-automation-id='jobPostingHeader'], h1")?.innerText || "";
    companyName =
      document.querySelector(
        "[data-automation-id='companyName'], [data-automation-id='legalEntity']"
      )?.innerText || "";
    jobDescription =
      document.querySelector("[data-automation-id='jobPostingDescription'], #jobDescriptionSection")
        ?.innerText || "";
  } else if (url.includes("dice.com")) {
    // Dice Selectors
    jobTitle = document.querySelector("h1[data-cy='jobTitle'], h1")?.innerText || "";
    companyName =
      document.querySelector("a[data-cy='companyNameLink'], [data-cy='companyName']")?.innerText ||
      "";
    jobDescription =
      document.querySelector("#jobDescription, [data-cy='jobDescription']")?.innerText || "";
  } else if (url.includes("wellfound.com")) {
    // Wellfound Selectors
    jobTitle = document.querySelector("h1, [class*='jobTitle']")?.innerText || "";
    companyName = document.querySelector("h2, [class*='companyName']")?.innerText || "";
    jobDescription =
      document.querySelector("[class*='description'], [class*='jobDescription']")?.innerText || "";
  }
  // ── Shared post-processing ─────────────────────────────────────────────
  // Strip "· Company · Location · N applicants" noise that bleeds in if the
  // container was grabbed instead of the anchor

  if (companyName) {
    companyName = companyName
      .split("\n")[0]
      .split("·")[0]
      .replace(/\s*at\s+/i, "")
      .trim()
      .replace(/\s+/g, " ");
  }

  // Fallback heuristic selectors
  if (!jobTitle) {
    jobTitle = document.title.split(" - ")[0].split(" | ")[0].trim();
  }
  if (!companyName) {
    const parts = document.title.split(" at ");
    if (parts.length > 1) {
      companyName = parts[1].split(" - ")[0].split(" | ")[0].trim();
    }
  }

  // Last-resort description — only fires if every selector above missed
  if (!jobDescription) {
    if (url.includes("linkedin.com")) {
      const pane = document.querySelector(
        ".jobs-search__job-details--container, .scaffold-layout__detail, .jobs-details__main-content, .job-view-layout, .jobs-details"
      );
      jobDescription = pane?.innerText || "";
    } else {
      const mainContent = document.querySelector(
        "main, article, #content, .job-description, .job-details"
      );
      jobDescription = mainContent?.innerText || "";
    }
  }

  jobTitle = jobTitle.trim().replace(/\s+/g, " ");
  companyName = companyName.trim().replace(/\s+/g, " ");
  jobDescription = jobDescription.trim();

  if (jobDescription.length > 8000) {
    jobDescription = jobDescription.slice(0, 8000) + "\n\n[Truncated]";
  }

  return { jobTitle, companyName, jobDescription, jobUrl: url };
}

// Expose scraper to popup.js cleanly
window.__rlScrape = scrapeJobDetails;
