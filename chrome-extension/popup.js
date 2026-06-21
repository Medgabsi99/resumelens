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

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Scrape details from active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = tabs[0];
    activeTabUrl = tab.url;

    // Inject and run scraping content script dynamically if not already running
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["content.js"],
      },
      (results) => {
        if (chrome.runtime.lastError || !results || results.length === 0) {
          console.warn("Could not execute script:", chrome.runtime.lastError);
          return;
        }

        const data = results[0].result;
        if (data) {
          if (data.jobTitle) jobTitleInput.value = data.jobTitle;
          if (data.companyName) companyNameInput.value = data.companyName;
          if (data.jobDescription) jobDescriptionInput.value = data.jobDescription;
        }
      }
    );
  });

  // 2. Test Backend connection & Load saved Resumes list
  try {
    const data = await callApi("/api/ext/resumes", "GET");
    if (data.success) {
      savedResumes = data.data || [];
      connectionBadge.innerText = "Connected";
      connectionBadge.classList.add("connected");
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
          const exists = savedResumes.some(r => r.id === result.activeResumeId);
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
      connectionBadge.innerText = "Log in to Web App";
      connectionBadge.classList.remove("connected");
      setupError.innerText = "Please log in to ResumeLens in your browser first.";
    } else {
      connectionBadge.innerText = "Disconnected";
      connectionBadge.classList.remove("connected");
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

  try {
    const data = await callApi("/api/ext/match", "POST", {
      resumeId,
      jobTitle,
      companyName,
      jobDescription,
    });

    latestMatchData = data.data;
    renderResults(companyName, jobTitle);
  } catch (err) {
    console.error("Match error:", err);
    loaderView.style.display = "none";
    setupView.style.display = "block";
    setupError.innerText = err.message || "Failed to analyze matching score.";
    setupError.style.display = "block";
  }
});

// Render Results Dashboards
function renderResults(company, title) {
  loaderView.style.display = "none";
  resultsView.style.display = "block";

  const score = latestMatchData.overallScore || 0;
  
  // Animate circular score progress SVG circle
  // circumference is 2 * PI * 15.915 = 100
  const offset = 100 - score;
  scoreValCircle.style.strokeDashoffset = offset;
  scoreText.innerText = `${score}%`;

  // Apply verdict badges
  fitVerdictBadge.className = `fit-badge ${latestMatchData.fitVerdict}`;
  fitVerdictBadge.innerText = `${latestMatchData.fitVerdict} Fit`;

  companyRoleText.innerText = `${title || "Scraped Role"} at ${company || "Scraped Company"}`;
  matchSummary.innerText = latestMatchData.summary || "Evaluation complete.";

  // Populate Keywords Chips
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
    keywordGrid.innerHTML = '<span style="font-size: 11px; color: var(--ink-faint);">No keywords extracted.</span>';
  }

  // Populate Recommendations List
  recommendationsList.innerHTML = "";
  const recs = latestMatchData.topRecommendations || [];
  recs.forEach((rec) => {
    const li = document.createElement("div");
    li.className = "rec-item";
    li.innerText = rec;
    recommendationsList.appendChild(li);
  });

  if (recs.length === 0) {
    recommendationsList.innerHTML = '<div style="font-size: 11px; color: var(--ink-faint);">Resume aligns well with requirements!</div>';
  }

  // Reset Track Button state
  trackBtn.disabled = false;
  trackBtn.innerText = "Add to Job Tracker 🎯";
  successAlert.style.display = "none";

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

  navigator.clipboard.writeText(text).then(() => {
    const originalText = copyOutreachBtn.innerText;
    copyOutreachBtn.innerText = "Copied! ✓";
    copyOutreachBtn.style.background = "var(--success)";
    setTimeout(() => {
      copyOutreachBtn.innerText = originalText;
    }, 1500);
  }).catch((err) => {
    console.error("Failed to copy text:", err);
  });
});
