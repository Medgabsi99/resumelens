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
  console.log("Watcher: Found local app at", base);

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(base, { waitUntil: "networkidle" });

  console.log(
    "Watcher: Page loaded. Waiting for export to be triggered in browser...",
  );

  // Wait up to 2 minutes for Open PDF link or PDF uploaded toast
  const timeout = 120000;
  try {
    const [openLink] = await Promise.all([
      page.waitForSelector("text=Open PDF", { timeout }).catch(() => null),
      page.waitForSelector("text=PDF uploaded", { timeout }).catch(() => null),
    ]);

    if (openLink) {
      const href = await openLink.getAttribute("href");
      console.log("Watcher: Open PDF link detected:", href);
    } else {
      console.log("Watcher: No Open PDF link detected within timeout.");
    }
  } catch (e) {
    console.error("Watcher error:", e);
  }

  await browser.close();
  console.log("Watcher: done");
})();
