function scrapeJobDetails() {
  const url = window.location.href;
  let jobTitle = "";
  let companyName = "";
  let jobDescription = "";

  if (url.includes("linkedin.com")) {

    // ── 1. JSON-LD (most stable, works on both logged-in and public pages) ──
    // LinkedIn embeds a <script type="application/ld+json"> JobPosting object
    // on every job detail page. It never changes with UI redesigns, so we try
    // this first before touching any CSS class that may be hashed/renamed.
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

        if (posting) {
          jobTitle = posting.title || "";
          companyName = posting.hiringOrganization?.name || "";
          // description comes as raw HTML — strip tags to get clean plain text
          const tmp = document.createElement("div");
          tmp.innerHTML = posting.description || "";
          jobDescription = tmp.innerText.trim();
          break;
        }
      }
    } catch (_) { }

    // ── 2. CSS selectors — logged-in authenticated layout ──────────────────
    // Only run if JSON-LD missed anything. Class names here are stable BEM
    // names LinkedIn has kept across multiple redesigns, but may still rotate.
    if (!jobTitle) {
      jobTitle =
        document.querySelector(
          ".job-details-jobs-unified-top-card__job-title h1, " +
          "h1.job-details-jobs-unified-top-card__job-title, " +
          ".jobs-unified-top-card__job-title h1"
        )?.innerText?.trim() || "";
    }

    if (!companyName) {
      // The company name lives inside an <a> tag inside the top-card container.
      // Selecting the container's full innerText pulls in "· Location · X applicants"
      // noise. We target the anchor directly, or the first link pointing to /company/.
      companyName =
        document.querySelector(
          ".job-details-jobs-unified-top-card__company-name a, " +
          ".jobs-unified-top-card__company-name a, " +
          ".topcard__org-name-link, " +
          "a[href*='linkedin.com/company/']"
        )?.innerText?.trim() || "";
    }

    if (!jobDescription) {
      // #job-details is the description panel. Its direct child
      // .jobs-box__html-content (or .jobs-description-content__text in newer
      // builds) holds ONLY the job description HTML — siblings like
      // "About the company" and "Meet the hiring team" live in separate
      // sections outside this element, so this selector is tight.
      const descEl =
        document.querySelector(
          "#job-details .jobs-box__html-content, " +
          "#job-details .jobs-description-content__text, " +
          ".jobs-description__content .jobs-box__html-content, " +
          ".jobs-description-content__text"
        ) ||
        // Older layout: show-more-less div wrapping the markup
        document.querySelector(
          ".jobs-description .show-more-less-html__markup, " +
          ".show-more-less-html__markup--less, " +
          ".show-more-less-html__markup"
        );

      jobDescription = descEl?.innerText?.trim() || "";
    }

    // ── 3. Public (unauthenticated) layout fallback ────────────────────────
    if (!jobTitle) {
      jobTitle =
        document.querySelector("h2.top-card-layout__title, h1.top-card-layout__title")
          ?.innerText?.trim() || "";
    }
    if (!companyName) {
      companyName =
        document.querySelector("a.topcard__org-name-link, .topcard__org-name-link")
          ?.innerText?.trim() || "";
    }
    if (!jobDescription) {
      jobDescription =
        document.querySelector(
          "div.show-more-less-html__markup, " +
          ".description__text .show-more-less-html__markup"
        )?.innerText?.trim() || "";
    }

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
    const mainContent = document.querySelector(
      "main, article, #content, .job-description, .job-details"
    );
    jobDescription = mainContent?.innerText || "";
  }

  jobTitle = jobTitle.trim().replace(/\s+/g, " ");
  companyName = companyName.trim().replace(/\s+/g, " ");
  jobDescription = jobDescription.trim();

  if (jobDescription.length > 8000) {
    jobDescription = jobDescription.slice(0, 8000) + "\n\n[Truncated]";
  }

  return { jobTitle, companyName, jobDescription, jobUrl: url };
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
      <button class="rl-btn" id="rlAutoFillBtn" style="margin-top: 8px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);" disabled>
        📝 Auto-Fill Job Form
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
  const autoFillBtn = document.getElementById("rlAutoFillBtn");

  select.addEventListener("change", (e) => {
    activeResumeId = e.target.value;
    button.disabled = !activeResumeId;
    autoFillBtn.disabled = !activeResumeId;
    if (activeResumeId) {
      chrome.storage.local.set({ activeResumeId });
    }
  });

  button.addEventListener("click", handleAutoTailorSync);
  autoFillBtn.addEventListener("click", handleAutoFillForm);

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
      const autoFillBtn = document.getElementById("rlAutoFillBtn");

      if (!response || !response.success || !response.data?.success) {
        if (select) {
          select.innerHTML = '<option value="">-- Log in to Web App --</option>';
        }
        if (button) button.disabled = true;
        if (autoFillBtn) autoFillBtn.disabled = true;
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
            if (autoFillBtn) autoFillBtn.disabled = false;
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
  note.innerText = "Running gemini-2.5 compatibility matching...";

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

function extractFieldsFromResume(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const nameLine = lines[0] || "";

  const nameParts = nameLine.split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  let email = "";
  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w+/);
  if (emailMatch) email = emailMatch[0];

  let phone = "";
  const phoneMatch = text.match(/[+]?[\d\s\-()]{7,}/);
  if (phoneMatch) phone = phoneMatch[0].trim();

  let linkedin = "";
  let github = "";
  let website = "";

  const linkMatches = text.match(/https?:\/\/[^\s]+/g) || [];
  linkMatches.forEach(link => {
    const cleanLink = link.replace(/[,;|]$/, "");
    if (cleanLink.includes("linkedin.com")) {
      linkedin = cleanLink;
    } else if (cleanLink.includes("github.com")) {
      github = cleanLink;
    } else if (!cleanLink.includes("resume") && !cleanLink.includes("portfolio")) {
      website = cleanLink;
    }
  });

  if (!linkedin) {
    const liMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    if (liMatch) linkedin = "https://" + liMatch[0];
  }
  if (!github) {
    const ghMatch = text.match(/github\.com\/[a-zA-Z0-9_-]+/i);
    if (ghMatch) github = "https://" + ghMatch[0];
  }

  let currentTitle = "";
  let currentCompany = "";

  const expIdx = lines.findIndex(l => l.toLowerCase().includes("experience") && l.length < 25);
  if (expIdx > -1 && expIdx + 1 < lines.length) {
    const firstJobLine = lines[expIdx + 1];
    const parts = firstJobLine.split(/\s+at\s+|\s+@\s+|\s+[—–-]\s+|\s*\|\s*/i);
    currentTitle = parts[0]?.trim() || "";
    currentCompany = parts[1]?.trim() || "";
  }

  let school = "";
  let degree = "";
  const eduIdx = lines.findIndex(l => l.toLowerCase().includes("education") && l.length < 25);
  if (eduIdx > -1 && eduIdx + 1 < lines.length) {
    const firstEduLine = lines[eduIdx + 1];
    const parts = firstEduLine.split(/\s+from\s+|\s+@\s+|\s+[—–-]\s+|\s*\|\s*|,\s*/i);
    degree = parts[0]?.trim() || "";
    school = parts[1]?.trim() || "";
  }

  return {
    fullName: nameLine,
    firstName,
    lastName,
    email,
    phone,
    linkedin,
    github,
    website,
    currentTitle,
    currentCompany,
    school,
    degree
  };
}

function findAndFillForm(fields) {
  const inputs = document.querySelectorAll("input, textarea, select");
  let fillCount = 0;

  inputs.forEach(el => {
    const id = (el.id || "").toLowerCase();
    const name = (el.name || "").toLowerCase();
    const placeholder = (el.placeholder || "").toLowerCase();
    const autocomplete = (el.getAttribute("autocomplete") || "").toLowerCase();

    let labelText = "";
    if (el.id) {
      const labelEl = document.querySelector(`label[for="${el.id}"]`);
      if (labelEl) labelText = labelEl.innerText.toLowerCase();
    }
    if (!labelText) {
      const parentLabel = el.closest("label");
      if (parentLabel) labelText = parentLabel.innerText.toLowerCase();
    }

    const testMatch = (patterns) => {
      return patterns.some(pattern =>
        id.includes(pattern) ||
        name.includes(pattern) ||
        placeholder.includes(pattern) ||
        autocomplete.includes(pattern) ||
        labelText.includes(pattern)
      );
    };

    let valToFill = null;

    if (testMatch(["first name", "firstname", "given name", "first_name"])) {
      valToFill = fields.firstName;
    } else if (testMatch(["last name", "lastname", "family name", "last_name", "surname"])) {
      valToFill = fields.lastName;
    } else if (testMatch(["full name", "fullname", "name"])) {
      valToFill = fields.fullName;
    } else if (testMatch(["email", "e-mail"])) {
      valToFill = fields.email;
    } else if (testMatch(["phone", "telephone", "mobile", "cell"])) {
      valToFill = fields.phone;
    } else if (testMatch(["linkedin"])) {
      valToFill = fields.linkedin;
    } else if (testMatch(["github"])) {
      valToFill = fields.github;
    } else if (testMatch(["portfolio", "website", "personal site", "homepage"])) {
      valToFill = fields.website || fields.github;
    } else if (testMatch(["employer", "company", "current firm"])) {
      valToFill = fields.currentCompany;
    } else if (testMatch(["job title", "current role", "occupation", "position"])) {
      valToFill = fields.currentTitle;
    } else if (testMatch(["school", "university", "college", "education institute"])) {
      valToFill = fields.school;
    } else if (testMatch(["degree", "education major", "program of study"])) {
      valToFill = fields.degree;
    }

    if (valToFill && !el.value) {
      fillElement(el, valToFill);
      fillCount++;

      const origBorder = el.style.border;
      el.style.border = "1.5px solid #10b981";
      setTimeout(() => {
        el.style.border = origBorder;
      }, 3000);
    }
  });

  return fillCount;
}

async function handleAutoFillForm() {
  if (!activeResumeId) return;

  const autoFillBtn = document.getElementById("rlAutoFillBtn");
  const note = document.getElementById("rlStatusNote");

  const originalText = autoFillBtn.innerText;
  autoFillBtn.disabled = true;
  autoFillBtn.innerText = "Filling... ⏳";
  note.innerText = "Parsing resume details...";

  const resume = savedResumes.find(r => r.id === activeResumeId);
  if (!resume || !resume.resume_text) {
    note.innerText = "Failed: Selected resume content is empty";
    autoFillBtn.disabled = false;
    autoFillBtn.innerText = originalText;
    return;
  }

  try {
    const fields = extractFieldsFromResume(resume.resume_text);
    note.innerText = "Scanning page inputs...";

    const fillCount = findAndFillForm(fields);

    if (fillCount > 0) {
      note.innerText = `Successfully filled ${fillCount} fields!`;
      showToast(`✓ Auto-filled ${fillCount} form inputs from your resume!`);
    } else {
      note.innerText = "Could not match any input fields on this page.";
      showToast("No standard fields detected for auto-fill.", true);
    }
  } catch (err) {
    console.error("Auto-fill error:", err);
    note.innerText = "Error: " + err.message;
    showToast("Error parsing or filling form", true);
  } finally {
    autoFillBtn.disabled = false;
    autoFillBtn.innerText = originalText;
  }
}

// Fill input/textarea value triggering synthetic React/Vue framework state updates
function fillElement(el, value) {
  if (el.tagName === "SELECT") {
    const lowerVal = value.toLowerCase();
    const matchedOption = Array.from(el.options).find(opt =>
      opt.text.toLowerCase().includes(lowerVal) || opt.value.toLowerCase().includes(lowerVal)
    );
    if (matchedOption) {
      el.value = matchedOption.value;
    }
  } else if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    // React overrides the native .value setter with its own tracked version.
    // Directly assigning el.value = x bypasses React's internal fiber state,
    // so the field looks filled but submits empty. We grab the original native
    // setter from the prototype and call it — React's change detection then
    // picks it up correctly when we fire the input event below.
    const proto =
      el.tagName === "INPUT"
        ? window.HTMLInputElement.prototype
        : window.HTMLTextAreaElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;

    if (nativeSetter) {
      nativeSetter.call(el, value);
    } else {
      // Non-React / plain DOM fallback
      el.value = value;
    }
  } else if (el.isContentEditable) {
    // contentEditable divs (e.g. Quill, Draft.js, ProseMirror)
    // innerText wipes the DOM structure, so use execCommand when available
    // to stay inside the editor's undo stack and mutation observers.
    el.focus();
    if (document.execCommand) {
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, value);
    } else {
      // execCommand removed in future browsers — manual fallback
      el.innerText = value;
    }
  }

  // Fire the full event sequence React/Vue/Angular all listen for.
  // `input`  → triggers React's onChange synthetic handler
  // `change` → triggers Vue/Angular and native form validation
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));

  // Some ATS forms (Workday, iCIMS) also watch blur for field-level validation
  try {
    el.focus();
    el.blur();
  } catch (e) { }
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

// ── SPA Navigation Monitor ────────────────────────────────────────────
// Guard against double-injection: popup.js re-executes this file via
// executeScript on pages already covered by manifest content_scripts
// (LinkedIn, Indeed). Without this check, each popup open stacks another
// setInterval on top of the existing one — 1 becomes 2 becomes N,
// hammering the DOM every 1.5s × N times and re-running checkUrlAndRender
// in overlapping bursts.
if (window.__rlIntervalRunning) {
  // Content script already live — skip re-initialization entirely.
  // __rlScrape is already bound, widget already mounted, interval already ticking.
} else {
  window.__rlIntervalRunning = true;

  // Poll for SPA URL changes. LinkedIn and Indeed are client-side routers —
  // they swap content without firing a full page load, so popstate/hashchange
  // alone are not enough. 1500ms is a reasonable balance between responsiveness
  // and CPU cost; a MutationObserver on document.title is a lower-overhead
  // alternative if this ever becomes a perf concern.
  setInterval(checkUrlAndRender, 1500);

  // Run immediately so the widget appears without waiting for the first tick.
  checkUrlAndRender();
}

// Expose scraper to popup.js so it can retrieve job details via
// executeScript { func: () => window.__rlScrape() } without needing
// to re-inject the full file and risk the double-injection problem above.
window.__rlScrape = scrapeJobDetails;
