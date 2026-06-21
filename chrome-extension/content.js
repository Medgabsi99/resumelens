// ── Scraper Function (callable dynamically from popup) ────────────────
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

  // Clean company name from extra noise
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

// ── Floating Control Widget Panel ─────────────────────────────────────
let widgetContainer = null;
let activeResumeId = null;
let savedResumes = [];
let isTailoring = false;

// Inject CSS styles once
function injectStyles() {
  if (document.getElementById("rl-widget-styles")) return;

  const styleEl = document.createElement("style");
  styleEl.id = "rl-widget-styles";
  styleEl.innerHTML = `
    .rl-panel {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 300px;
      background: #0d1117;
      border: 1.5px solid rgba(139, 92, 246, 0.25);
      border-radius: 16px;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 16px;
      color: #f0f6fc;
      z-index: 999999;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .rl-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .rl-title {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #a78bfa, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .rl-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 20px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .rl-label {
      font-size: 11px;
      font-weight: 600;
      color: #8b949e;
      display: block;
      margin-bottom: 6px;
    }
    .rl-select {
      width: 100%;
      background: #161b22;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 8px 10px;
      color: #c9d1d9;
      font-size: 12px;
      outline: none;
      margin-bottom: 12px;
      cursor: pointer;
    }
    .rl-select:focus {
      border-color: #8b5cf6;
    }
    .rl-btn {
      width: 100%;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
      transition: all 0.2s;
    }
    .rl-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(139, 92, 246, 0.3);
    }
    .rl-btn:active:not(:disabled) {
      transform: translateY(0);
    }
    .rl-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      box-shadow: none;
    }
    .rl-note {
      font-size: 11px;
      color: #8b949e;
      text-align: center;
      margin-top: 10px;
      line-height: 1.4;
      font-style: italic;
    }
    .rl-toast {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999999;
      background: #10b981;
      color: #ffffff;
      border-radius: 10px;
      padding: 12px 20px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 8px;
      animation: rlToastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes rlToastSlideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(styleEl);
}

// Show standard Toast notification on page
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = "rl-toast";
  if (isError) {
    toast.style.background = "#ef4444";
  }
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    toast.style.transition = "all 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Build floating panel elements
function buildWidget() {
  if (widgetContainer) return;

  injectStyles();

  widgetContainer = document.createElement("div");
  widgetContainer.className = "rl-panel";
  widgetContainer.innerHTML = `
    <div class="rl-header">
      <div class="rl-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="color: #a78bfa;">
          <path d="M2 12h5l3.5 9L15 3l3.5 9H22"/>
        </svg>
        ResumeLens Sync
      </div>
      <span class="rl-badge">Scraper Online</span>
    </div>
    <div>
      <label class="rl-label">Active Tailoring Resume</label>
      <select class="rl-select" id="rlResumeSelect">
        <option value="">-- Choose Resume --</option>
      </select>
      <button class="rl-btn" id="rlTailorBtn" disabled>
        ✨ Auto-Tailor & Inject
      </button>
      <div class="rl-note" id="rlStatusNote">
        Click elements inside application form to target injection
      </div>
    </div>
  `;

  document.body.appendChild(widgetContainer);

  // Hook up event listeners
  const select = document.getElementById("rlResumeSelect");
  const button = document.getElementById("rlTailorBtn");

  select.addEventListener("change", (e) => {
    activeResumeId = e.target.value;
    button.disabled = !activeResumeId;
    if (activeResumeId) {
      chrome.storage.local.set({ activeResumeId });
    }
  });

  button.addEventListener("click", handleAutoTailorSync);

  // Sync state
  syncResumesAndState();
}

// Retrieve resumes list and sync stored state
function syncResumesAndState() {
  chrome.runtime.sendMessage(
    { action: "apiCall", data: { endpoint: "/api/ext/resumes", method: "GET" } },
    (response) => {
      const select = document.getElementById("rlResumeSelect");
      const button = document.getElementById("rlTailorBtn");

      if (!response || !response.success || !response.data?.success) {
        if (select) {
          select.innerHTML = '<option value="">-- Log in to Web App --</option>';
        }
        if (button) button.disabled = true;
        return;
      }

      savedResumes = response.data.data || [];
      if (select) {
        select.innerHTML = '<option value="">-- Select Target Resume --</option>';
        savedResumes.forEach((resume) => {
          const opt = document.createElement("option");
          opt.value = resume.id;
          opt.innerText = `${resume.name} (${resume.target_role || "No Role"})`;
          select.appendChild(opt);
        });

        // Load active ID
        chrome.storage.local.get(["activeResumeId"], (result) => {
          if (result.activeResumeId && savedResumes.some(r => r.id === result.activeResumeId)) {
            activeResumeId = result.activeResumeId;
            select.value = activeResumeId;
            if (button) button.disabled = false;
          }
        });
      }
    }
  );
}

// Tailoring trigger handler
async function handleAutoTailorSync() {
  if (isTailoring || !activeResumeId) return;

  const button = document.getElementById("rlTailorBtn");
  const note = document.getElementById("rlStatusNote");

  isTailoring = true;
  button.disabled = true;
  button.innerText = "Tailoring resume... ⏳";
  note.innerText = "Running Gemini compatibility matching...";

  // 1. Scrape listing context
  const details = scrapeJobDetails();

  // 2. Call background helper to fetch tailored resume
  chrome.runtime.sendMessage(
    {
      action: "apiCall",
      data: {
        endpoint: "/api/ext/tailor",
        method: "POST",
        body: {
          resumeId: activeResumeId,
          jobDescription: details.jobDescription,
          jobTitle: details.jobTitle,
          companyName: details.companyName
        }
      }
    },
    (response) => {
      isTailoring = false;
      button.disabled = false;
      button.innerText = "✨ Auto-Tailor & Inject";

      if (!response || !response.success || !response.data?.success) {
        const errorMsg = response?.error || response?.data?.error || "Tailoring failed";
        note.innerText = "Failed: " + errorMsg;
        showToast("Error tailoring: " + errorMsg, true);
        return;
      }

      const tailoredText = response.data.tailoredText;

      // 3. Inject tailored text directly into forms
      injectTailoredText(tailoredText);
    }
  );
}

// Page element auto-detection and injection algorithm
function injectTailoredText(text) {
  const note = document.getElementById("rlStatusNote");

  // Attempt A: target active document element
  const activeEl = document.activeElement;
  const isInputOrTextArea = activeEl && (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT" || activeEl.isContentEditable);

  if (isInputOrTextArea) {
    fillElement(activeEl, text);
    note.innerText = "Injected successfully into focused field!";
    showToast("✓ Tailored text injected directly into active input!");
    return;
  }

  // Attempt B: Scan DOM for common textareas matching resume forms
  const commonSelectors = [
    "textarea[placeholder*='resume' i]",
    "textarea[placeholder*='cv' i]",
    "textarea[placeholder*='experience' i]",
    "textarea[placeholder*='cover letter' i]",
    "textarea[id*='resume' i]",
    "textarea[id*='cv' i]",
    "textarea[name*='resume' i]",
    "textarea[name*='cv' i]",
    "div[contenteditable='true']",
    "textarea" // fallback to any textarea on page
  ];

  for (const selector of commonSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      fillElement(el, text);
      note.innerText = "Filled resume/experience text box!";
      showToast("✓ Tailored text injected into detected form field!");
      return;
    }
  }

  // Attempt C: Clipboard fallback
  navigator.clipboard.writeText(text).then(() => {
    note.innerText = "Copied tailored text to clipboard! Paste using Ctrl+V";
    showToast("✓ Copied tailored resume text! Paste directly into form (Ctrl+V)");
  }).catch(() => {
    note.innerText = "Could not inject. Please focus a textbox first.";
    showToast("Failed to inject or copy text. Try focusing a textarea first.", true);
  });
}

// Fill input/textarea value triggering synthetic React/Vue framework state updates
function fillElement(el, value) {
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    el.value = value;
  } else if (el.isContentEditable) {
    el.innerText = value;
  }

  // Fire input/change events so framework state observers register the updates
  const inputEvent = new Event("input", { bubbles: true });
  const changeEvent = new Event("change", { bubbles: true });
  el.dispatchEvent(inputEvent);
  el.dispatchEvent(changeEvent);
  
  // Attempt to focus and blur to commit fields
  try {
    el.focus();
    el.blur();
  } catch(e){}
}

// ── SPA Transition Routing Observer ───────────────────────────────────
function checkUrlAndRender() {
  const url = window.location.href;
  const isListingPage =
    url.includes("linkedin.com/jobs") ||
    url.includes("indeed.com/viewjob") ||
    url.includes("indeed.com/jobs") ||
    url.includes("greenhouse.io") ||
    url.includes("lever.co");

  if (isListingPage) {
    buildWidget();
    if (widgetContainer) {
      widgetContainer.style.display = "block";
    }
  } else {
    if (widgetContainer) {
      widgetContainer.style.display = "none";
    }
  }
}

// Monitor SPA navigation
let spaInterval = setInterval(checkUrlAndRender, 1500);
checkUrlAndRender();
