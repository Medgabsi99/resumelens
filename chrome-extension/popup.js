// DOM Elements
const connectionBadge = document.getElementById("connectionBadge");
const resumeSelector = document.getElementById("resumeSelector");
const jobTitleInput = document.getElementById("jobTitle");
const companyNameInput = document.getElementById("companyName");
const jobDescriptionInput = document.getElementById("jobDescription");
const matchBtn = document.getElementById("matchBtn");
const setupError = document.getElementById("setupError");
const resultError = document.getElementById("resultError");
const successAlert = document.getElementById("successAlert");

const setupView = document.getElementById("setup");
const loaderView = document.getElementById("loader");
const resultsView = document.getElementById("results");

const scoreValCircle = document.getElementById("scoreValCircle");
const scoreText = document.getElementById("scoreText");
const fitVerdictBadge = document.getElementById("fitVerdict");
const companyRoleText = document.getElementById("companyRoleText");
const matchSummary = document.getElementById("matchSummary");
const keywordGrid = document.getElementById("keywordGrid");
const recommendationsList = document.getElementById("recommendationsList");
const trackBtn = document.getElementById("trackBtn");
const backBtn = document.getElementById("backBtn");

// Outreach Panel Elements
const recruiterNameInput = document.getElementById("recruiterName");
const outreachTypeSelect = document.getElementById("outreachType");
const outreachBtn = document.getElementById("outreachBtn");
const outreachResultBox = document.getElementById("outreachResultBox");
const outreachText = document.getElementById("outreachText");
const copyOutreachBtn = document.getElementById("copyOutreachBtn");
const outreachLoader = document.getElementById("outreachLoader");
const outreachError = document.getElementById("outreachError");

// State
let activeTabUrl = "";
let latestMatchData = null;
let savedResumes = [];

// Helper to delegate fetch requests to background script (avoids CSP issues)
async function callApi(endpoint, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "apiCall", data: { endpoint, method, body } },
      (response) => {
        if (!response) {
          reject(new Error("No response from service worker"));
          return;
        }
        if (!response.success) {
          reject(new Error(response.error || `HTTP error (${response.status || 500})`));
          return;
        }
        resolve(response.data);
      }
    );
  });
}

const rescrapeBtn = document.getElementById("rescrapeBtn");

// Scrape logic
function scrapeCurrentTab() {
  jobTitleInput.placeholder = "Scraping title...";
  companyNameInput.placeholder = "Scraping company...";
  jobDescriptionInput.placeholder = "Scraping description...";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = tabs[0];
    activeTabUrl = tab.url;

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => {
          const url = window.location.href;
          let jobTitle = "";
          let companyName = "";
          let jobDescription = "";

          // --- 1. LINKEDIN DEDICATED SCRAPER ---
          if (url.includes("linkedin.com")) {
            // A. Title
            const titleSelectors = [
              ".job-details-jobs-unified-top-card__job-title h1",
              "h1.job-details-jobs-unified-top-card__job-title",
              ".jobs-unified-top-card__job-title h1",
              ".job-details-jobs-unified-top-card__job-title",
              ".jobs-search__job-details h1",
              ".jobs-details h1",
              "h1.t-24",
              "h2.top-card-layout__title",
              "h1.topcard__title",
              "h1",
            ];
            for (const sel of titleSelectors) {
              const el = document.querySelector(sel);
              if (el && el.innerText && el.innerText.trim()) {
                jobTitle = el.innerText.trim();
                break;
              }
            }

            // B. Company Name
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

            // C. Job Description - Try Exact Selectors First
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

            // D. Fallback: Search all page containers, strictly ignoring the left search results rail
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
                  el.matches(
                    "[class*='search-results'], [class*='left-rail'], [class*='list-container']"
                  )
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

            // E. JSON-LD fallback for standalone pages
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

            // F. Clean header cards and trailing marketing footers
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
                "Missions",
                "Responsibilities",
                "Requirements",
                "Qualifications",
              ];

              for (const marker of startMarkers) {
                const idx = jobDescription.toLowerCase().indexOf(marker.toLowerCase());
                if (idx !== -1 && idx < Math.max(600, jobDescription.length * 0.4)) {
                  const sliced = jobDescription.slice(idx + marker.length).trim();
                  if (sliced.length > 50) {
                    jobDescription = sliced;
                    break;
                  }
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
            jobTitle =
              document.querySelector(".jobsearch-JobInfoHeader-title, h1")?.innerText || "";
            companyName =
              document.querySelector(
                ".jobsearch-CompanyInfoWithoutHeaderImage, [data-company-name]"
              )?.innerText || "";
            jobDescription =
              document.querySelector("#jobDescriptionText, #job-details, main")?.innerText || "";
          } else if (url.includes("glassdoor.com")) {
            jobTitle =
              document.querySelector("[data-test='jobTitle'], .JobDetails_jobTitle__g2_4c, h1")
                ?.innerText || "";
            companyName =
              document.querySelector(
                "[data-test='employerName'], .EmployerProfile_employerName__N_v_0, .employer-name"
              )?.innerText || "";
            jobDescription =
              document.querySelector(
                ".JobDetails_jobDescription__2L0vB, #JobDescriptionContainer, .desc, main"
              )?.innerText || "";
          } else if (url.includes("ziprecruiter.com")) {
            jobTitle = document.querySelector("h1.job_title, h1.text-primary, h1")?.innerText || "";
            companyName =
              document.querySelector(".hiring_company_text, .job_company, a.company_name")
                ?.innerText || "";
            jobDescription =
              document.querySelector(".job_description, .jobDescriptionSection, #job_desc, main")
                ?.innerText || "";
          } else if (url.includes("greenhouse.io")) {
            jobTitle = document.querySelector(".header-header h1, .app-title, h1")?.innerText || "";
            companyName = document.querySelector(".company-name")?.innerText || "";
            jobDescription = document.querySelector("#content, main")?.innerText || "";
          } else if (url.includes("lever.co")) {
            jobTitle = document.querySelector(".posting-header h2, h1")?.innerText || "";
            companyName =
              document.querySelector(".posting-header .logo, .posting-header")?.innerText || "";
            if (companyName) companyName = companyName.split("\n")[0].trim();
            jobDescription =
              document.querySelector(".section.page-centered, main")?.innerText || "";
          } else if (url.includes("ashbyhq.com")) {
            jobTitle =
              document.querySelector("h1, [class*='heading'], [class*='title']")?.innerText || "";
            companyName =
              document.querySelector("[class*='company'], [class*='header'] a")?.innerText || "";
            jobDescription =
              document.querySelector(
                "[class*='description'], [class*='jobDescription'], [class*='body'], main"
              )?.innerText || "";
          } else if (url.includes("myworkdayjobs.com") || url.includes("workday.com")) {
            jobTitle =
              document.querySelector("h2[data-automation-id='jobPostingHeader'], h1")?.innerText ||
              "";
            companyName =
              document.querySelector(
                "[data-automation-id='companyName'], [data-automation-id='legalEntity']"
              )?.innerText || "";
            jobDescription =
              document.querySelector(
                "[data-automation-id='jobPostingDescription'], #jobDescriptionSection, main"
              )?.innerText || "";
          } else if (url.includes("dice.com")) {
            jobTitle = document.querySelector("h1[data-cy='jobTitle'], h1")?.innerText || "";
            companyName =
              document.querySelector("a[data-cy='companyNameLink'], [data-cy='companyName']")
                ?.innerText || "";
            jobDescription =
              document.querySelector("#jobDescription, [data-cy='jobDescription'], main")
                ?.innerText || "";
          } else if (url.includes("wellfound.com")) {
            jobTitle = document.querySelector("h1, [class*='jobTitle']")?.innerText || "";
            companyName = document.querySelector("h2, [class*='companyName']")?.innerText || "";
            jobDescription =
              document.querySelector("[class*='description'], [class*='jobDescription'], main")
                ?.innerText || "";
          } else {
            jobTitle =
              document
                .querySelector("h1, [data-test='jobTitle'], .jobsearch-JobInfoHeader-title")
                ?.innerText?.trim() || document.title.split(" - ")[0].split(" | ")[0].trim();

            const compEl = document.querySelector(
              "[data-company-name], [data-test='employerName'], .company-name, a[href*='/company/']"
            );
            companyName =
              compEl?.innerText?.trim() ||
              (() => {
                const parts = document.title.split(" at ");
                return parts.length > 1 ? parts[1].split(" - ")[0].split(" | ")[0].trim() : "";
              })();

            const main = document.querySelector(
              "#jobDescriptionText, #job-details, .JobDetails_jobDescription__2L0vB, #content, .job-description, .job-details, article, main"
            );
            jobDescription = (main?.innerText || "").trim();
          }

          if (companyName) {
            companyName = companyName
              .split("\n")[0]
              .split("·")[0]
              .replace(/\s*at\s+/i, "")
              .trim()
              .replace(/\s+/g, " ");
          }
          if (!jobTitle) {
            jobTitle = document.title.split(" - ")[0].split(" | ")[0].trim();
          }
          if (!companyName) {
            const parts = document.title.split(" at ");
            if (parts.length > 1) {
              companyName = parts[1].split(" - ")[0].split(" | ")[0].trim();
            }
          }
          if (jobTitle) {
            jobTitle = jobTitle.trim().replace(/\s+/g, " ");
          }
          if (jobDescription.length > 8000) {
            jobDescription = jobDescription.slice(0, 8000) + "\n\n[Truncated]";
          }

          return { jobTitle, companyName, jobDescription, jobUrl: url };
        },
      },
      (results) => {
        if (chrome.runtime.lastError || !results || results.length === 0) {
          console.warn("Could not execute script:", chrome.runtime.lastError);
          jobDescriptionInput.placeholder = "Failed to scrape. Paste job description here.";
          return;
        }

        const data = results[0].result;
        if (data) {
          if (data.jobTitle) jobTitleInput.value = data.jobTitle;
          if (data.companyName) companyNameInput.value = data.companyName;
          if (data.jobDescription) {
            jobDescriptionInput.value = data.jobDescription;
          } else {
            jobDescriptionInput.placeholder = "Paste job description here or click Rescrape...";
          }
        }
      }
    );
  });
}

function setConnectionStatus(status, text) {
  connectionBadge.className = `badge ${status}`;
  connectionBadge.innerHTML = `<span class="status-dot"></span><span>${text}</span>`;
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // Bind Rescrape button
  if (rescrapeBtn) {
    rescrapeBtn.addEventListener("click", () => {
      scrapeCurrentTab();
    });
  }

  // 1. Scrape details from active tab
  scrapeCurrentTab();

  // 2. Test Backend connection & Load saved Resumes list
  try {
    const data = await callApi("/api/ext/resumes", "GET");
    if (data.success) {
      savedResumes = data.data || [];
      setConnectionStatus("connected", "Connected");
      setupError.style.display = "none";

      // Populate Selector
      resumeSelector.innerHTML = '<option value="">-- Choose a resume from library --</option>';
      savedResumes.forEach((resume) => {
        const option = document.createElement("option");
        option.value = resume.id;
        option.innerText = `${resume.name} (${resume.target_role || "No Target Role"})`;
        resumeSelector.appendChild(option);
      });

      // Restore activeResumeId from chrome.storage.local
      chrome.storage.local.get(["activeResumeId"], (result) => {
        if (result.activeResumeId) {
          const exists = savedResumes.some((r) => r.id === result.activeResumeId);
          if (exists) {
            resumeSelector.value = result.activeResumeId;
            matchBtn.disabled = false;
          }
        }
      });

      // Enable match button and save activeResumeId on change
      resumeSelector.addEventListener("change", () => {
        const val = resumeSelector.value;
        matchBtn.disabled = !val;
        if (val) {
          chrome.storage.local.set({ activeResumeId: val });
        }
      });
    } else {
      throw new Error(data.error || "Failed to fetch resumes");
    }
  } catch (err) {
    console.error("Connection error:", err);
    if (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized")) {
      setConnectionStatus("", "Log in to Web App");
      setupError.innerText = "Please log in to ResumeLens in your browser first.";
    } else {
      setConnectionStatus("", "Disconnected");
      setupError.innerText = "Connection failed. Make sure Next.js is running at localhost:3000";
    }
    setupError.style.display = "block";
  }
});

// Calculate Match Score Click
matchBtn.addEventListener("click", async () => {
  const resumeId = resumeSelector.value;
  const jobTitle = jobTitleInput.value.trim();
  const companyName = companyNameInput.value.trim();
  const jobDescription = jobDescriptionInput.value.trim();

  if (!resumeId || !jobDescription) return;

  setupView.style.display = "none";
  loaderView.style.display = "block";
  resultError.style.display = "none";
  setupError.style.display = "none";

  try {
    const res = await callApi("/api/ext/match", "POST", {
      resumeId,
      jobTitle,
      companyName,
      jobDescription,
    });

    // Unpack data with multi-layer resilience
    latestMatchData = res?.data?.data || res?.data || res;
    if (!latestMatchData || typeof latestMatchData !== "object") {
      throw new Error("Unable to parse match results from server.");
    }

    renderResults(companyName, jobTitle);
  } catch (err) {
    console.error("Match error:", err);
    loaderView.style.display = "none";
    setupView.style.display = "block";
    setupError.innerText =
      err.message || "Failed to analyze matching score. Please check your connection.";
    setupError.style.display = "block";
  }
});

// Render Results Dashboards
function renderResults(company, title) {
  if (!latestMatchData) return;

  loaderView.style.display = "none";
  setupView.style.display = "none";
  resultsView.style.display = "block";

  // Ensure default first tab is active
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  const firstTabBtn = document.querySelector('.tab-btn[data-tab="keywordsTab"]');
  const firstPanel = document.getElementById("keywordsTab");
  if (firstTabBtn) firstTabBtn.classList.add("active");
  if (firstPanel) firstPanel.classList.add("active");

  const score = Math.round(Number(latestMatchData.overallScore) || 50);

  // Animate circular score progress SVG circle
  // circumference is 2 * PI * 15.915 = 100
  const offset = Math.max(0, Math.min(100, 100 - score));
  if (scoreValCircle) {
    scoreValCircle.style.strokeDashoffset = offset;
  }
  if (scoreText) {
    scoreText.innerText = `${score}%`;
  }

  // Apply verdict badges
  const verdict =
    latestMatchData.fitVerdict ||
    (score >= 80 ? "strong" : score >= 65 ? "good" : score >= 50 ? "fair" : "weak");
  if (fitVerdictBadge) {
    fitVerdictBadge.className = `fit-badge ${verdict}`;
    fitVerdictBadge.innerText = `${verdict} Fit`;
  }

  if (companyRoleText) {
    companyRoleText.innerText = `${title || "Scraped Role"} at ${company || "Scraped Company"}`;
  }
  if (matchSummary) {
    matchSummary.innerText = latestMatchData.summary || "Evaluation complete.";
  }

  // Populate Keywords Chips
  if (keywordGrid) {
    keywordGrid.innerHTML = "";
    const matchedList = latestMatchData.matchedKeywords || latestMatchData.matchedSkills || [];
    const missingList = latestMatchData.missingKeywords || latestMatchData.missingSkills || [];

    matchedList.forEach((kw) => {
      const chip = document.createElement("span");
      chip.className = "chip matched";
      chip.innerText = kw;
      keywordGrid.appendChild(chip);
    });

    missingList.forEach((kw) => {
      const chip = document.createElement("span");
      chip.className = "chip missing";
      chip.innerText = kw;
      keywordGrid.appendChild(chip);
    });

    if (matchedList.length === 0 && missingList.length === 0) {
      keywordGrid.innerHTML =
        '<span style="font-size: 11px; color: var(--ink-faint);">No keywords extracted.</span>';
    }
  }

  // Populate Recommendations List
  if (recommendationsList) {
    recommendationsList.innerHTML = "";
    const recs = latestMatchData.topRecommendations || latestMatchData.strengths || [];
    recs.forEach((rec) => {
      const li = document.createElement("div");
      li.className = "rec-item";
      li.innerText = rec;
      recommendationsList.appendChild(li);
    });

    if (recs.length === 0) {
      recommendationsList.innerHTML =
        '<div style="font-size: 11px; color: var(--ink-faint);">Resume aligns well with requirements!</div>';
    }
  }

  // Reset Track Button state
  if (trackBtn) {
    trackBtn.disabled = false;
    trackBtn.innerText = "Add to Job Tracker 🎯";
  }
  if (successAlert) {
    successAlert.style.display = "none";
  }

  // Reset Outreach Panel
  if (recruiterNameInput) recruiterNameInput.value = "";
  if (outreachTypeSelect) outreachTypeSelect.value = "recruiter";
  if (outreachResultBox) outreachResultBox.style.display = "none";
  if (outreachLoader) outreachLoader.style.display = "none";
  if (outreachError) {
    outreachError.style.display = "none";
    outreachError.innerText = "";
  }
  if (outreachText) outreachText.value = "";
}

// Track application button click
trackBtn.addEventListener("click", async () => {
  const resumeId = resumeSelector.value;
  const jobTitle = jobTitleInput.value.trim();
  const companyName = companyNameInput.value.trim();
  const jobDescription = jobDescriptionInput.value.trim();

  if (!latestMatchData) return;

  trackBtn.disabled = true;
  trackBtn.innerText = "Adding to Tracker...";
  resultError.style.display = "none";

  try {
    await callApi("/api/ext/apply", "POST", {
      resumeId,
      jobTitle,
      companyName,
      jobUrl: activeTabUrl,
      jobDescription,
      overallScore: latestMatchData.overallScore,
      fitVerdict: latestMatchData.fitVerdict,
      resultJson: latestMatchData,
    });

    trackBtn.innerText = "Tracked ✓";
    successAlert.innerText = "✓ Scored listing logged directly to web dashboard tracker!";
    successAlert.style.display = "block";
  } catch (err) {
    console.error("Track error:", err);
    trackBtn.disabled = false;
    trackBtn.innerText = "Add to Job Tracker 🎯";
    resultError.innerText = err.message || "Failed to add application card.";
    resultError.style.display = "block";
  }
});

// Back Button Click
backBtn.addEventListener("click", () => {
  resultsView.style.display = "none";
  setupView.style.display = "block";
  successAlert.style.display = "none";
});

// Generate Outreach Pitch Click
outreachBtn.addEventListener("click", async () => {
  const resumeId = resumeSelector.value;
  const jobTitle = jobTitleInput.value.trim();
  const companyName = companyNameInput.value.trim();
  const jobDescription = jobDescriptionInput.value.trim();
  const recruiterName = recruiterNameInput.value.trim();
  const outreachType = outreachTypeSelect.value;

  if (!resumeId || !jobTitle || !companyName || !jobDescription) {
    outreachError.innerText = "Missing resume or job details to generate pitch.";
    outreachError.style.display = "block";
    return;
  }

  outreachBtn.disabled = true;
  outreachLoader.style.display = "block";
  outreachResultBox.style.display = "none";
  outreachError.style.display = "none";
  outreachError.innerText = "";

  try {
    const data = await callApi("/api/ext/outreach", "POST", {
      resumeId,
      jobTitle,
      companyName,
      jobDescription,
      recruiterName: recruiterName || undefined,
      outreachType,
    });

    outreachText.value = data.data;
    outreachResultBox.style.display = "block";
  } catch (err) {
    console.error("Outreach generation error:", err);
    outreachError.innerText = err.message || "Failed to generate outreach pitch.";
    outreachError.style.display = "block";
  } finally {
    outreachLoader.style.display = "none";
    outreachBtn.disabled = false;
  }
});

// Copy outreach pitch to clipboard
copyOutreachBtn.addEventListener("click", () => {
  const text = outreachText.value;
  if (!text) return;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = copyOutreachBtn.innerText;
      copyOutreachBtn.innerText = "Copied! ✓";
      copyOutreachBtn.style.background = "var(--success)";
      setTimeout(() => {
        copyOutreachBtn.innerText = originalText;
      }, 1500);
    })
    .catch((err) => {
      console.error("Failed to copy text:", err);
    });
});

// Tab Navigation Controller
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-tab");
    if (!targetId) return;

    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    const panel = document.getElementById(targetId);
    if (panel) panel.classList.add("active");
  });
});
