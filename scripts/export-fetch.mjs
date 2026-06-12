import fs from "fs";
import { fileURLToPath } from "url";
const uri = "http://localhost:3004/api/export-pdf";
const payload = {
  template: "classic",
  result: {
    score: 88,
    summary: "Great",
    suggestions: [],
    strengths: [],
    weaknesses: [],
  },
  targetRole: "Software Engineer",
  jobDescription: "Build apps",
  resumeText: "Experienced dev",
};

const res = await fetch(uri, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const contentType = res.headers.get("content-type") || "";
if (contentType.includes("application/json")) {
  const j = await res.json();
  if (j?.success && j?.url) {
    const r2 = await fetch(j.url);
    const buf2 = await r2.arrayBuffer();
    fs.writeFileSync("exported-uploaded.pdf", Buffer.from(buf2));
    console.log("Downloaded exported-uploaded.pdf from", j.url);
  } else {
    console.error("JSON response did not contain a url:", j);
  }
} else if (contentType.includes("application/pdf")) {
  const out = fs.createWriteStream("exported-direct.pdf");
  const buf = await res.arrayBuffer();
  fs.writeFileSync("exported-direct.pdf", Buffer.from(buf));
  console.log("Saved exported-direct.pdf");
} else {
  const txt = await res.text();
  console.log("Unexpected response type:", contentType, txt.slice(0, 200));
}
