const DEFAULT_BACKEND_URL = "http://localhost:3000";

async function getBackendUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["resumelens_backend_url"], (result) => {
      resolve(result.resumelens_backend_url || DEFAULT_BACKEND_URL);
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "apiCall") {
    const { endpoint, method = "GET", body = null } = request.data;

    getBackendUrl().then((backendUrl) => {
      const fetchOptions = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      };

      if (body && method !== "GET" && method !== "HEAD") {
        fetchOptions.body = JSON.stringify(body);
      }

      fetch(`${backendUrl}${endpoint}`, fetchOptions)
        .then(async (res) => {
          const contentType = res.headers.get("content-type") || "";
          const isJson = contentType.includes("application/json");
          const data = isJson ? await res.json() : { text: await res.text() };

          if (!res.ok) {
            sendResponse({
              success: false,
              status: res.status,
              error: data.error || data.message || `HTTP Error ${res.status}`,
            });
            return;
          }

          sendResponse({ success: true, data });
        })
        .catch((err) => {
          console.error("Background API fetch error:", err);
          sendResponse({
            success: false,
            error: err.message || "Failed to contact ResumeLens server",
          });
        });
    });

    return true; // Keep channel open for async sendResponse
  }
});
