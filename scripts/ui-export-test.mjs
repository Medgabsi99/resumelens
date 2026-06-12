import playwright from "playwright";

async function findLocalUrl() {
  const ports = Array.from({ length: 21 }, (_, i) => 3000 + i);
  for (const port of ports) {
    try {
      const res = await fetch(`http://localhost:${port}/`, { method: "GET" });
      if (res.ok) return `http://localhost:${port}`;
    } catch (e) {
      // ignore
    }
  }
  throw new Error("No local dev server found on ports 3000-3020");
}

(async () => {
  const base = await findLocalUrl();
  console.log("Found local app at", base);

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(base, { waitUntil: "networkidle" });

  // Wait for the export button
  const btn = await page.waitForSelector(
    'button:has-text("Download Hi-Fi PDF")',
    { timeout: 10000 },
  );
  if (!btn) throw new Error("Export button not found");

  // Click it
  await btn.click();
  console.log("Clicked export button");

  // Wait for either an Open PDF link or a toast message
  try {
    const openLink = await page.waitForSelector("text=Open PDF", {
      timeout: 20000,
    });
    if (openLink) {
      const href = await openLink.getAttribute("href");
      console.log("Open PDF link found:", href);
    }
  } catch (e) {
    console.log("Open PDF link not found within timeout");
  }

  try {
    const toast = await page.waitForSelector("text=PDF uploaded", {
      timeout: 20000,
    });
    if (toast) {
      console.log("Toast detected: PDF uploaded");
    }
  } catch (e) {
    console.log("No PDF uploaded toast detected");
  }

  await browser.close();
})();
