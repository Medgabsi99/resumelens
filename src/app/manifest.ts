import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ResumeLens — AI Resume Reviewer",
    short_name: "ResumeLens",
    description:
      "Get honest, structured AI feedback on your resume in seconds. ATS score, strengths, weaknesses, rewrite suggestions, cover letters, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#6366f1",
    orientation: "portrait-primary",
    categories: ["productivity", "business", "utilities"],
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
