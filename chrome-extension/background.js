const BACKEND_URL = "http://localhost:3000";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "apiCall") {
    const { endpoint, method = "GET", body = null } = request.data;
    
    const fetchOptions = {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include"
    };
    
    if (body && method !== "GET" && method !== "HEAD") {
      fetchOptions.body = JSON.stringify(body);
    }

    fetch(`${BACKEND_URL}${endpoint}`, fetchOptions)
      .then(async (res) => {
        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const data = isJson ? await res.json() : { text: await res.text() };

        if (!res.ok) {
          sendResponse({
            success: false,
            status: res.status,
            error: data.error || data.message || `HTTP Error ${res.status}`
          });
          return;
        }

        sendResponse({ success: true, data });
      })
      .catch((err) => {
        console.error("Background API fetch error:", err);
        sendResponse({ success: false, error: err.message || "Failed to contact local server" });
      });
      
    return true; // Keep channel open for async sendResponse
  }
});
