"use client";

import { logger } from "@/lib/logger";
import React, { useState, useRef } from "react";
import { Loader2, Sparkles, AlertTriangle, ArrowDown, Check } from "lucide-react";
import { parseResume, type ParsedResume } from "@/lib/parseResume";
import TechProTemplate from "./resume-templates/TechProTemplate";
import ProfessionalTemplate from "./resume-templates/ProfessionalTemplate";
import ModernTemplate from "./resume-templates/ModernTemplate";
import CreativeTemplate from "./resume-templates/CreativeTemplate";
import MinimalTemplate from "./resume-templates/MinimalTemplate";
import ExecutiveTemplate from "./resume-templates/ExecutiveTemplate";
import SidebarTemplate from "./resume-templates/SidebarTemplate";
import BoldHeaderTemplate from "./resume-templates/BoldHeaderTemplate";
import ElegantTemplate from "./resume-templates/ElegantTemplate";

interface Props {
  resumeText: string;
  targetRole?: string;
}

type TemplateId =
  | "tech-pro"
  | "professional"
  | "modern"
  | "creative"
  | "minimal"
  | "executive"
  | "sidebar"
  | "bold-header"
  | "elegant";

interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  component: React.ComponentType<{
    resumeText: string;
    targetRole?: string;
    parsedData?: ParsedResume;
  }>;
  thumbnail: React.ReactNode;
}

/* ─── SVG Thumbnail Previews ──────────────────────────────────────────── */

const ProfessionalThumb = () => (
  <svg
    viewBox="0 0 100 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect width="100" height="130" fill="#ffffff" />
    <rect x="10" y="10" width="80" height="18" rx="1" fill="#1e3a8a" opacity="0.9" />
    <rect x="20" y="14" width="40" height="4" rx="1" fill="white" opacity="0.9" />
    <rect x="20" y="21" width="25" height="2.5" rx="1" fill="white" opacity="0.6" />
    <rect x="10" y="32" width="80" height="1" fill="#1e3a8a" opacity="0.4" />
    <rect x="10" y="37" width="22" height="2.5" rx="1" fill="#1e3a8a" opacity="0.8" />
    <rect x="10" y="43" width="80" height="2" rx="1" fill="#e5e7eb" />
    <rect x="10" y="47" width="70" height="2" rx="1" fill="#e5e7eb" />
    <rect x="10" y="51" width="55" height="2" rx="1" fill="#e5e7eb" />
    <rect x="10" y="59" width="22" height="2.5" rx="1" fill="#1e3a8a" opacity="0.8" />
    <rect x="10" y="65" width="80" height="2" rx="1" fill="#e5e7eb" />
    <rect x="10" y="69" width="70" height="2" rx="1" fill="#e5e7eb" />
    <rect x="10" y="73" width="60" height="2" rx="1" fill="#e5e7eb" />
    <rect x="10" y="77" width="75" height="2" rx="1" fill="#e5e7eb" />
    <rect x="10" y="85" width="22" height="2.5" rx="1" fill="#1e3a8a" opacity="0.8" />
    <rect x="10" y="91" width="80" height="2" rx="1" fill="#e5e7eb" />
    <rect x="10" y="95" width="65" height="2" rx="1" fill="#e5e7eb" />
  </svg>
);

const ModernThumb = () => (
  <svg
    viewBox="0 0 100 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect width="100" height="130" fill="#ffffff" />
    <defs>
      <linearGradient id="mg" x1="0" y1="0" x2="100" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="100" height="36" fill="url(#mg)" />
    <rect x="8" y="8" width="35" height="5" rx="1" fill="white" opacity="0.9" />
    <rect x="8" y="16" width="22" height="3" rx="1" fill="white" opacity="0.6" />
    <rect x="8" y="22" width="55" height="2" rx="1" fill="white" opacity="0.4" />
    <rect x="8" y="42" width="20" height="2.5" rx="1" fill="#6366f1" opacity="0.8" />
    <rect x="8" y="48" width="84" height="2" rx="1" fill="#e5e7eb" />
    <rect x="8" y="52" width="74" height="2" rx="1" fill="#e5e7eb" />
    <rect x="8" y="58" width="20" height="2.5" rx="1" fill="#6366f1" opacity="0.8" />
    <rect x="8" y="64" width="70" height="2" rx="1" fill="#e5e7eb" />
    <rect x="8" y="68" width="84" height="2" rx="1" fill="#e5e7eb" />
    <rect x="8" y="72" width="60" height="2" rx="1" fill="#e5e7eb" />
    <rect x="8" y="78" width="20" height="2.5" rx="1" fill="#6366f1" opacity="0.8" />
    <rect x="8" y="84" width="30" height="4" rx="2" fill="#ede9fe" />
    <rect x="42" y="84" width="22" height="4" rx="2" fill="#ede9fe" />
    <rect x="68" y="84" width="24" height="4" rx="2" fill="#ede9fe" />
  </svg>
);

const CreativeThumb = () => (
  <svg
    viewBox="0 0 100 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect width="100" height="130" fill="#ffffff" />
    <rect x="0" y="0" width="8" height="130" fill="#ec4899" />
    <rect x="0" y="0" width="8" height="44" fill="#8b5cf6" />
    <rect x="16" y="10" width="36" height="5" rx="1" fill="#1a1a1a" opacity="0.85" />
    <rect x="16" y="18" width="24" height="3" rx="1" fill="#ec4899" opacity="0.8" />
    <rect x="16" y="24" width="50" height="2" rx="1" fill="#9ca3af" />
    <rect x="16" y="35" width="18" height="2.5" rx="1" fill="#8b5cf6" opacity="0.8" />
    <rect x="16" y="41" width="75" height="2" rx="1" fill="#e5e7eb" />
    <rect x="16" y="45" width="65" height="2" rx="1" fill="#e5e7eb" />
    <rect x="16" y="53" width="18" height="2.5" rx="1" fill="#8b5cf6" opacity="0.8" />
    <rect x="16" y="59" width="75" height="2" rx="1" fill="#e5e7eb" />
    <rect x="16" y="63" width="60" height="2" rx="1" fill="#e5e7eb" />
    <rect x="16" y="67" width="70" height="2" rx="1" fill="#e5e7eb" />
    <rect x="16" y="75" width="18" height="2.5" rx="1" fill="#8b5cf6" opacity="0.8" />
    <rect x="16" y="81" width="28" height="5" rx="2" fill="#fce7f3" />
    <rect x="48" y="81" width="22" height="5" rx="2" fill="#fce7f3" />
    <rect x="74" y="81" width="18" height="5" rx="2" fill="#fce7f3" />
  </svg>
);

const MinimalThumb = () => (
  <svg
    viewBox="0 0 100 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect width="100" height="130" fill="#ffffff" />
    <rect x="10" y="12" width="44" height="6" rx="1" fill="#111827" opacity="0.85" />
    <rect x="10" y="21" width="28" height="2.5" rx="1" fill="#6b7280" />
    <rect x="10" y="27" width="60" height="2" rx="1" fill="#d1d5db" />
    <rect x="10" y="35" width="80" height="0.5" fill="#e5e7eb" />
    <rect x="10" y="40" width="15" height="2" rx="1" fill="#111827" opacity="0.6" />
    <rect x="10" y="46" width="80" height="1.5" rx="1" fill="#f3f4f6" />
    <rect x="10" y="50" width="70" height="1.5" rx="1" fill="#f3f4f6" />
    <rect x="10" y="54" width="75" height="1.5" rx="1" fill="#f3f4f6" />
    <rect x="10" y="62" width="15" height="2" rx="1" fill="#111827" opacity="0.6" />
    <rect x="10" y="68" width="80" height="1.5" rx="1" fill="#f3f4f6" />
    <rect x="10" y="72" width="65" height="1.5" rx="1" fill="#f3f4f6" />
    <rect x="10" y="76" width="72" height="1.5" rx="1" fill="#f3f4f6" />
    <rect x="10" y="82" width="80" height="0.5" fill="#e5e7eb" />
    <rect x="10" y="87" width="15" height="2" rx="1" fill="#111827" opacity="0.6" />
    <rect x="10" y="93" width="25" height="4" rx="2" fill="#f3f4f6" />
    <rect x="38" y="93" width="20" height="4" rx="2" fill="#f3f4f6" />
    <rect x="62" y="93" width="28" height="4" rx="2" fill="#f3f4f6" />
  </svg>
);

const ExecutiveThumb = () => (
  <svg
    viewBox="0 0 100 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect width="100" height="130" fill="#fdfdf9" />
    <rect x="0" y="0" width="100" height="3" fill="#1a1a1a" />
    <rect x="10" y="12" width="80" height="1" fill="#c9a84c" opacity="0.5" />
    <rect x="10" y="16" width="44" height="6" rx="1" fill="#1a1a1a" opacity="0.85" />
    <rect x="18" y="25" width="30" height="2.5" rx="1" fill="#6b5e4a" />
    <rect x="10" y="31" width="80" height="1" fill="#c9a84c" opacity="0.5" />
    <rect x="10" y="37" width="80" height="2" rx="1" fill="#e8e0d0" />
    <rect x="10" y="41" width="68" height="2" rx="1" fill="#e8e0d0" />
    <rect x="10" y="49" width="18" height="2" rx="1" fill="#b8860b" opacity="0.8" />
    <rect x="10" y="55" width="80" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="10" y="59" width="70" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="10" y="63" width="75" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="10" y="71" width="18" height="2" rx="1" fill="#b8860b" opacity="0.8" />
    <rect x="10" y="77" width="80" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="10" y="81" width="65" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="0" y="126" width="100" height="4" fill="#1a1a1a" />
  </svg>
);

const SidebarThumb = () => (
  <svg
    viewBox="0 0 100 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect width="100" height="130" fill="#ffffff" />
    <rect x="0" y="0" width="32" height="130" fill="#1e3a5f" />
    <rect x="5" y="12" width="22" height="4" rx="1" fill="white" opacity="0.9" />
    <rect x="5" y="19" width="16" height="2.5" rx="1" fill="#93c5fd" opacity="0.7" />
    <rect x="0" y="28" width="32" height="0.5" fill="white" opacity="0.2" />
    <rect x="5" y="33" width="12" height="2" rx="1" fill="#93c5fd" opacity="0.6" />
    <rect x="5" y="38" width="22" height="1.5" rx="1" fill="white" opacity="0.5" />
    <rect x="5" y="41.5" width="18" height="1.5" rx="1" fill="white" opacity="0.5" />
    <rect x="5" y="45" width="20" height="1.5" rx="1" fill="white" opacity="0.5" />
    <rect x="0" y="52" width="32" height="0.5" fill="white" opacity="0.2" />
    <rect x="5" y="57" width="12" height="2" rx="1" fill="#93c5fd" opacity="0.6" />
    {[61, 65.5, 70, 74.5, 79].map((y, i) => (
      <g key={i}>
        <rect x="5" y={y} width={14 + (i % 2) * 4} height="1.5" rx="1" fill="white" opacity="0.4" />
        <rect
          x={20 + (i % 2) * 4}
          y={y + 0.25}
          width={32 - (20 + (i % 2) * 4)}
          height="1"
          rx="1"
          fill="white"
          opacity="0.15"
        />
      </g>
    ))}
    {/* Right panel */}
    <rect x="38" y="10" width="18" height="2.5" rx="1" fill="#1e3a5f" opacity="0.7" />
    <rect x="38" y="16" width="54" height="1" fill="#e5e7eb" />
    <rect x="38" y="20" width="54" height="2" rx="1" fill="#e5e7eb" />
    <rect x="38" y="24" width="44" height="2" rx="1" fill="#e5e7eb" />
    <rect x="38" y="32" width="18" height="2.5" rx="1" fill="#1e3a5f" opacity="0.7" />
    <rect x="38" y="38" width="54" height="2" rx="1" fill="#e5e7eb" />
    <rect x="38" y="42" width="44" height="2" rx="1" fill="#e5e7eb" />
    <rect x="38" y="46" width="50" height="2" rx="1" fill="#e5e7eb" />
    <rect x="38" y="52" width="44" height="2" rx="1" fill="#e5e7eb" />
    <rect x="38" y="60" width="18" height="2.5" rx="1" fill="#1e3a5f" opacity="0.7" />
    <rect x="38" y="66" width="54" height="2" rx="1" fill="#e5e7eb" />
    <rect x="38" y="70" width="40" height="2" rx="1" fill="#e5e7eb" />
  </svg>
);

const BoldHeaderThumb = () => (
  <svg
    viewBox="0 0 100 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect width="100" height="130" fill="#ffffff" />
    <defs>
      <linearGradient id="bh" x1="0" y1="0" x2="100" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="0.5" stopColor="#4f46e5" />
        <stop offset="1" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="100" height="40" fill="url(#bh)" />
    <rect x="8" y="8" width="40" height="6" rx="1" fill="white" opacity="0.92" />
    <rect x="8" y="17" width="26" height="3" rx="1" fill="white" opacity="0.65" />
    <rect x="8" y="28" width="14" height="4" rx="8" fill="white" opacity="0.3" />
    <rect x="25" y="28" width="18" height="4" rx="8" fill="white" opacity="0.3" />
    <rect x="46" y="28" width="22" height="4" rx="8" fill="white" opacity="0.3" />
    {/* Left exp column */}
    <rect x="8" y="46" width="55" height="2" rx="1" fill="#111827" opacity="0.7" />
    <rect x="8" y="52" width="55" height="1.5" rx="1" fill="#e5e7eb" />
    <rect x="8" y="55.5" width="44" height="1.5" rx="1" fill="#e5e7eb" />
    <rect x="8" y="59" width="50" height="1.5" rx="1" fill="#e5e7eb" />
    <rect x="8" y="65" width="55" height="1.5" rx="1" fill="#e5e7eb" />
    <rect x="8" y="68.5" width="40" height="1.5" rx="1" fill="#e5e7eb" />
    {/* Right skills column */}
    <rect x="68" y="46" width="24" height="2" rx="1" fill="#111827" opacity="0.7" />
    <rect x="68" y="52" width="15" height="4" rx="2" fill="#f3f0ff" />
    <rect x="68" y="58" width="20" height="4" rx="2" fill="#f3f0ff" />
    <rect x="68" y="64" width="12" height="4" rx="2" fill="#f3f0ff" />
    <rect x="68" y="70" width="18" height="4" rx="2" fill="#f3f0ff" />
  </svg>
);

const ElegantThumb = () => (
  <svg
    viewBox="0 0 100 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect width="100" height="130" fill="#fdfdf9" />
    <rect x="0" y="0" width="100" height="3" fill="url(#eg)" />
    <defs>
      <linearGradient id="eg" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#b8860b" />
        <stop offset="0.5" stopColor="#d4af37" />
        <stop offset="1" stopColor="#b8860b" />
      </linearGradient>
    </defs>
    <rect x="20" y="9" width="60" height="1" fill="#b8860b" opacity="0.3" />
    <rect x="28" y="13" width="44" height="5.5" rx="1" fill="#1a1a1a" opacity="0.82" />
    <rect x="32" y="21" width="36" height="2.5" rx="1" fill="#6b5e4a" opacity="0.6" />
    <rect x="15" y="27" width="70" height="1" fill="#e8e0d0" />
    <rect x="15" y="31" width="25" height="1.5" rx="1" fill="#b8860b" opacity="0.7" />
    <rect
      x="42"
      y="30.5"
      width="2"
      height="2"
      rx="0.5"
      fill="#b8860b"
      opacity="0.7"
      transform="rotate(45 43 31.5)"
    />
    <rect x="48" y="31" width="37" height="1.5" rx="1" fill="#b8860b" opacity="0.7" />
    <rect x="10" y="37" width="80" height="2" rx="1" fill="#e8e0d0" />
    <rect x="10" y="41" width="68" height="2" rx="1" fill="#e8e0d0" />
    <rect x="10" y="48" width="16" height="2" rx="1" fill="#b8860b" opacity="0.7" />
    <rect x="10" y="54" width="80" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="10" y="57.5" width="68" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="10" y="61" width="74" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="10" y="68" width="80" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="10" y="71.5" width="60" height="1.5" rx="1" fill="#e8e0d0" />
    {/* Two-col bottom */}
    <rect x="10" y="79" width="38" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="10" y="82.5" width="32" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="10" y="86" width="36" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="55" y="79" width="35" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="55" y="82.5" width="28" height="1.5" rx="1" fill="#e8e0d0" />
    <rect x="0" y="126" width="100" height="3" fill="url(#eg)" />
  </svg>
);

/* ─── Template Registry ──────────────────────────────────────────────── */

const TechProThumb = () => (
  <svg
    viewBox="0 0 100 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect width="100" height="130" fill="#ffffff" />
    <defs>
      <linearGradient id="tp" x1="0" y1="0" x2="100" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0f172a" />
        <stop offset="0.6" stopColor="#1e3a8a" />
        <stop offset="1" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="100" height="34" fill="url(#tp)" />
    <rect x="8" y="8" width="38" height="5" rx="1" fill="white" opacity="0.92" />
    <rect x="8" y="16" width="24" height="3" rx="1" fill="#93c5fd" opacity="0.8" />
    <rect x="8" y="22" width="60" height="2" rx="1" fill="white" opacity="0.35" />
    <rect x="0" y="34" width="100" height="2" fill="#1d4ed8" opacity="0.6" />
    {/* Skills row */}
    <rect x="8" y="41" width="14" height="2" rx="1" fill="#1d4ed8" opacity="0.7" />
    <rect x="8" y="46" width="84" height="1" fill="#cbd5e1" opacity="0.5" />
    <rect x="8" y="49" width="70" height="1.5" rx="1" fill="#e2e8f0" />
    <rect x="8" y="53" width="60" height="1.5" rx="1" fill="#e2e8f0" />
    {/* Experience */}
    <rect x="8" y="60" width="18" height="2" rx="1" fill="#1d4ed8" opacity="0.7" />
    <rect x="8" y="65" width="84" height="1" fill="#cbd5e1" opacity="0.5" />
    <rect x="8" y="68" width="50" height="1.5" rx="1" fill="#e2e8f0" />
    <rect x="8" y="71.5" width="80" height="1.5" rx="1" fill="#e2e8f0" />
    <rect x="8" y="75" width="72" height="1.5" rx="1" fill="#e2e8f0" />
    <rect x="8" y="80" width="50" height="1.5" rx="1" fill="#e2e8f0" />
    <rect x="8" y="83.5" width="76" height="1.5" rx="1" fill="#e2e8f0" />
    {/* Education */}
    <rect x="8" y="91" width="16" height="2" rx="1" fill="#1d4ed8" opacity="0.7" />
    <rect x="8" y="96" width="84" height="1" fill="#cbd5e1" opacity="0.5" />
    <rect x="8" y="99" width="55" height="1.5" rx="1" fill="#e2e8f0" />
    <rect x="8" y="102.5" width="40" height="1.5" rx="1" fill="#e2e8f0" />
    {/* Footer accent */}
    <rect x="0" y="127" width="100" height="3" fill="url(#tp)" />
  </svg>
);

const templates: TemplateInfo[] = [
  {
    id: "tech-pro",
    name: "Tech Pro",
    description: "ATS-optimized for IT & SWE roles — dark header, skills-first",
    badge: "ATS ✓",
    badgeColor: "#16a34a",
    component: TechProTemplate,
    thumbnail: <TechProThumb />,
  },
  {
    id: "professional",
    name: "Classic Pro",
    description: "Timeless serif format — corporate, banking, consulting",
    component: ProfessionalTemplate,
    thumbnail: <ProfessionalThumb />,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Gradient header, skill chips, great for tech roles",
    component: ModernTemplate,
    thumbnail: <ModernThumb />,
  },
  {
    id: "creative",
    name: "Creative",
    description: "Color sidebar accent, bold typography",
    component: CreativeTemplate,
    thumbnail: <CreativeThumb />,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Whitespace-forward, clean and timeless",
    component: MinimalTemplate,
    thumbnail: <MinimalThumb />,
  },
  {
    id: "executive",
    name: "Executive",
    description: "Serif font, formal structure for senior roles",
    component: ExecutiveTemplate,
    thumbnail: <ExecutiveThumb />,
  },
  {
    id: "sidebar",
    name: "Sidebar Pro",
    description: "Two-column with colored sidebar for contact & skills",
    badge: "NEW",
    badgeColor: "#059669",
    component: SidebarTemplate,
    thumbnail: <SidebarThumb />,
  },
  {
    id: "bold-header",
    name: "Bold Header",
    description: "Gradient hero header with timeline experience",
    badge: "NEW",
    badgeColor: "#7c3aed",
    component: BoldHeaderTemplate,
    thumbnail: <BoldHeaderThumb />,
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Gold serif CV style, ideal for senior candidates",
    badge: "NEW",
    badgeColor: "#b8860b",
    component: ElegantTemplate,
    thumbnail: <ElegantThumb />,
  },
];

/* ─── Component ─────────────────────────────────────────────────────── */

export default function ResumeTemplateSelector({ resumeText, targetRole }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [smartError, setSmartError] = useState<string | null>(null);
  const [recommendedTemplate, setRecommendedTemplate] = useState<TemplateId | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState<TemplateId | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSelectTemplate = (templateId: TemplateId) => {
    setSelectedTemplate(templateId);
    setShowPreview(true);
  };

  const handleDownloadPdf = async () => {
    if (!selectedTemplate) return;
    setIsDownloading(true);
    try {
      const data = parsedData || parseResume(resumeText);
      const { downloadResumePdf } = await import("@/lib/pdf/downloadPdf");
      await downloadResumePdf(selectedTemplate, data, targetRole);
    } catch (err: unknown) {
      logger.error("PDF download error:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSmartGenerate = async () => {
    setIsGenerating(true);
    setSmartError(null);
    try {
      const res = await fetch("/api/smart-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetRole }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Generation failed");
      setParsedData(data.parsedResume);
      setIsEnhanced(true);
      if (data.recommendedTemplate) {
        const valid: TemplateId[] = [
          "tech-pro",
          "professional",
          "modern",
          "creative",
          "minimal",
          "executive",
          "sidebar",
          "bold-header",
          "elegant",
        ];
        if (valid.includes(data.recommendedTemplate as TemplateId)) {
          setRecommendedTemplate(data.recommendedTemplate as TemplateId);
          setSelectedTemplate(data.recommendedTemplate as TemplateId);
          setShowPreview(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Smart generation failed";
      setSmartError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const SelectedTemplateComponent = selectedTemplate
    ? templates.find((t) => t.id === selectedTemplate)?.component
    : null;

  return (
    <div>
      {/* Smart Generate */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleSmartGenerate}
          disabled={isGenerating}
          style={{
            background: isGenerating
              ? "linear-gradient(135deg, #7c3aed, #6366f1)"
              : "linear-gradient(135deg, #8b5cf6, #6366f1)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 22px",
            fontSize: 13,
            fontWeight: 700,
            cursor: isGenerating ? "wait" : "pointer",
            fontFamily: "Instrument Sans, sans-serif",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            opacity: isGenerating ? 0.85 : 1,
          }}
        >
          {isGenerating ? (
            <>
              <span style={{ display: "inline-flex", animation: "spin 1s linear infinite" }}>
                <Loader2 size={14} />
              </span>
              AI is restructuring your resume...
            </>
          ) : (
            <>
              <Sparkles size={14} /> Smart Generate
            </>
          )}
        </button>
        {isEnhanced && (
          <span
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "white",
              padding: "4px 14px",
              borderRadius: 14,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Sparkles size={11} /> AI Enhanced
            </span>
          </span>
        )}
        {smartError && (
          <span style={{ color: "#dc2626", fontSize: 12, fontWeight: 500 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={12} /> {smartError}
            </span>
          </span>
        )}
      </div>

      {/* Template Grid with Visual Thumbnails */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          const isRecommended = recommendedTemplate === template.id;
          const isHovered = hoveredTemplate === template.id;

          return (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              style={{
                cursor: "pointer",
                borderRadius: 12,
                border: isSelected
                  ? "2px solid var(--accent)"
                  : isRecommended
                    ? "2px solid #8b5cf6"
                    : "2px solid var(--border)",
                background: "var(--paper-card)",
                overflow: "hidden",
                position: "relative",
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: isSelected
                  ? "translateY(-3px)"
                  : isHovered
                    ? "translateY(-2px)"
                    : "none",
                boxShadow: isSelected
                  ? "0 8px 24px -6px rgba(139,92,246,0.4)"
                  : isHovered
                    ? "0 4px 16px -4px rgba(0,0,0,0.12)"
                    : "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              {/* NEW / AI Pick badge */}
              {(template.badge || isRecommended) && (
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: isRecommended
                      ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                      : template.badgeColor,
                    color: "white",
                    fontSize: 8,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 6,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    zIndex: 2,
                    lineHeight: 1.5,
                  }}
                >
                  {isRecommended ? "★ AI Pick" : template.badge}
                </div>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                  }}
                >
                  <Check size={10} color="white" strokeWidth={3} />
                </div>
              )}

              {/* Thumbnail SVG */}
              <div
                style={{
                  height: 130,
                  background: "#f9fafb",
                  borderBottom: "1px solid var(--border)",
                  padding: 0,
                  overflow: "hidden",
                }}
              >
                {template.thumbnail}
              </div>

              {/* Label */}
              <div style={{ padding: "8px 10px 10px" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isSelected ? "var(--accent)" : "var(--ink)",
                    marginBottom: 3,
                    fontFamily: "Instrument Sans, sans-serif",
                  }}
                >
                  {template.name}
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    color: "var(--ink-muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {template.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Section */}
      {showPreview && SelectedTemplateComponent && (
        <div
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              background: "var(--paper-warm)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>
              Previewing:{" "}
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                {templates.find((t) => t.id === selectedTemplate)?.name}
              </span>
              {isEnhanced && (
                <span
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 700,
                    marginLeft: 8,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={10} /> AI Enhanced
                  </span>
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink-muted)",
                  border: "1px solid var(--border)",
                  background: "var(--paper-card)",
                  borderRadius: 10,
                  padding: "7px 14px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                style={{
                  background: isDownloading
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "7px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isDownloading ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 10px rgba(99,102,241,0.3)",
                }}
              >
                {isDownloading ? (
                  "Generating…"
                ) : (
                  <>
                    <ArrowDown size={13} /> Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
          <div
            ref={previewRef}
            style={{
              border: "none",
              maxHeight: "700px",
              overflowY: "auto",
              background: "var(--paper-card)",
            }}
          >
            <SelectedTemplateComponent
              resumeText={resumeText}
              targetRole={targetRole}
              parsedData={parsedData || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
