import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ResumeLens — AI Resume Reviewer & ATS Optimizer",
    short_name: "ResumeLens",
    description:
      "Get instant 100-point ATS compliance scoring, recruiter rewrites, cover letter generation, and job matching.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
