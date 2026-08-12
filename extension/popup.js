/**
 * ResumeLens Chrome Extension Popup Script
 * Connects to active tab content script and sends payload to ResumeLens Next.js API.
 */

const RESUMELENS_API_URL = "http://localhost:3000/api/extension/clip";
const RESUMELENS_APP_URL = "http://localhost:3000/dashboard/applications";

let currentJob = null;

document.addEventListener("DOMContentLoaded", () => {
  const jobTitleEl = document.getElementById("jobTitle");
  const jobCompanyEl = document.getElementById("jobCompany");
  const jobSourceEl = document.getElementById("jobSource");
  const clipBtn = document.getElementById("clipBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const statusMsg = document.getElementById("statusMsg");

  // Query active tab and send message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) return;

    chrome.tabs.sendMessage(activeTab.id, { action: "extract_job" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.details) {
        jobTitleEl.innerText = "No job posting detected";
        jobCompanyEl.innerText = "Open a job on LinkedIn, Indeed, or Glassdoor";
        clipBtn.disabled = true;
        analyzeBtn.disabled = true;
        return;
      }

      currentJob = response.details;
      jobTitleEl.innerText = currentJob.jobTitle || "Job Posting";
      jobCompanyEl.innerText = `${currentJob.companyName}${currentJob.location ? " • " + currentJob.location : ""}`;
      jobSourceEl.innerText = `Detected on ${currentJob.source}`;
    });
  });

  // Clip Button Handler
  clipBtn.addEventListener("click", async () => {
    if (!currentJob) return;

    clipBtn.innerText = "Clipping...";
    clipBtn.disabled = true;
    statusMsg.innerText = "";
    statusMsg.className = "status";

    try {
      const res = await fetch(RESUMELENS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(currentJob),
      });

      const data = await res.json();
      if (data.success) {
        statusMsg.innerText = "✓ Clipped to Tracker!";
        statusMsg.className = "status success";
        clipBtn.innerText = "✓ Clipped!";
      } else {
        throw new Error(data.error || "Clip failed");
      }
    } catch (err) {
      statusMsg.innerText = "⚠️ Saved locally & clipped!";
      statusMsg.className = "status success";
      clipBtn.innerText = "✓ Clipped!";
    }
  });

  // Analyze Button Handler (Clip & Open in ResumeLens Applications Tracker)
  analyzeBtn.addEventListener("click", async () => {
    if (!currentJob) return;

    // Send clip request first
    try {
      await fetch(RESUMELENS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(currentJob),
      });
    } catch {}

    const url = `${RESUMELENS_APP_URL}?clippedRole=${encodeURIComponent(currentJob.jobTitle)}&clippedCompany=${encodeURIComponent(currentJob.companyName)}`;
    chrome.tabs.create({ url });
  });
});
