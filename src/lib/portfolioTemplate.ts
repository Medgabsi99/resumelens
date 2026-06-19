import { PortfolioData } from "./ai";

// ─── Theme definitions ──────────────────────────────────────

interface ThemeConfig {
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderHover: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentGlow: string;
  accentText: string;
  gradientA: string;
  gradientB: string;
  navBg: string;
  footerBg: string;
  timelineDot: string;
  tagBg: string;
  tagText: string;
  tagBorder: string;
  headingFont: string;
  bodyFont: string;
  googleFontUrl: string;
}

const THEMES: Record<string, ThemeConfig> = {
  "modern-dark": {
    bg: "#090d16",
    surface: "rgba(30,35,55,0.6)",
    surfaceHover: "rgba(40,45,70,0.8)",
    border: "rgba(255,255,255,0.07)",
    borderHover: "rgba(139,92,246,0.35)",
    text: "#e2e8f0",
    textMuted: "rgba(226,232,240,0.65)",
    textFaint: "rgba(226,232,240,0.40)",
    accent: "#8b5cf6",
    accentGlow: "rgba(139,92,246,0.14)",
    accentText: "#a78bfa",
    gradientA: "#8b5cf6",
    gradientB: "#6366f1",
    navBg: "rgba(9,13,22,0.88)",
    footerBg: "#090d16",
    timelineDot: "#8b5cf6",
    tagBg: "rgba(139,92,246,0.12)",
    tagText: "#a78bfa",
    tagBorder: "rgba(139,92,246,0.25)",
    headingFont: "'Outfit', sans-serif",
    bodyFont: "'Outfit', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap",
  },
  "minimal-light": {
    bg: "#fafaf9",
    surface: "#ffffff",
    surfaceHover: "#f5f5f4",
    border: "#e7e5e4",
    borderHover: "#a8a29e",
    text: "#1c1917",
    textMuted: "rgba(28,25,23,0.65)",
    textFaint: "rgba(28,25,23,0.40)",
    accent: "#1c1917",
    accentGlow: "rgba(28,25,23,0.06)",
    accentText: "#1c1917",
    gradientA: "#292524",
    gradientB: "#57534e",
    navBg: "rgba(250,250,249,0.92)",
    footerBg: "#f5f5f4",
    timelineDot: "#1c1917",
    tagBg: "#f5f5f4",
    tagText: "#44403c",
    tagBorder: "#d6d3d1",
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
  },
  "creative-neon": {
    bg: "#09090b",
    surface: "rgba(24,24,27,0.7)",
    surfaceHover: "rgba(39,39,42,0.9)",
    border: "rgba(255,255,255,0.07)",
    borderHover: "rgba(16,185,129,0.40)",
    text: "#f4f4f5",
    textMuted: "rgba(244,244,245,0.65)",
    textFaint: "rgba(244,244,245,0.40)",
    accent: "#10b981",
    accentGlow: "rgba(16,185,129,0.13)",
    accentText: "#34d399",
    gradientA: "#10b981",
    gradientB: "#06b6d4",
    navBg: "rgba(9,9,11,0.88)",
    footerBg: "#09090b",
    timelineDot: "#10b981",
    tagBg: "rgba(16,185,129,0.10)",
    tagText: "#34d399",
    tagBorder: "rgba(16,185,129,0.22)",
    headingFont: "'Outfit', sans-serif",
    bodyFont: "'Outfit', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap",
  },
  "warm-professional": {
    bg: "#fafaf9",
    surface: "#ffffff",
    surfaceHover: "#f0fdf4",
    border: "#d1fae5",
    borderHover: "#6ee7b7",
    text: "#1a2e1a",
    textMuted: "rgba(26,46,26,0.65)",
    textFaint: "rgba(26,46,26,0.40)",
    accent: "#064e3b",
    accentGlow: "rgba(6,78,59,0.08)",
    accentText: "#064e3b",
    gradientA: "#064e3b",
    gradientB: "#065f46",
    navBg: "rgba(250,250,249,0.92)",
    footerBg: "#f0fdf4",
    timelineDot: "#064e3b",
    tagBg: "rgba(6,78,59,0.06)",
    tagText: "#064e3b",
    tagBorder: "#a7f3d0",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Inter', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap",
  },
};

// ─── HTML Generator ─────────────────────────────────────────

export function generatePortfolioHtml(
  content: PortfolioData,
  theme: string
): string {
  const t: ThemeConfig = THEMES[theme] ?? THEMES["modern-dark"];

  const escapeHtml = (text: string) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const skillsHtml = content.skills
    .map(
      (cat) => `
      <div class="skill-card">
        <h3 class="skill-category">${escapeHtml(cat.category)}</h3>
        <div class="skill-tags">
          ${cat.items
            .map(
              (item) =>
                `<span class="skill-tag">${escapeHtml(item)}</span>`
            )
            .join("")}
        </div>
      </div>`
    )
    .join("");

  const experienceHtml = content.experience
    .map(
      (exp) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-header">
          <div>
            <h3 class="exp-role">${escapeHtml(exp.role)}</h3>
            <p class="exp-company">${escapeHtml(exp.company)}</p>
          </div>
          <span class="exp-dates">${escapeHtml(exp.dates)}</span>
        </div>
        <p class="exp-desc">${escapeHtml(exp.description)}</p>
      </div>`
    )
    .join("");

  const projectsHtml = content.projects
    .map(
      (proj) => `
      <div class="project-card hover-lift">
        <div>
          <div class="project-header">
            <h3 class="project-title">${escapeHtml(proj.title)}</h3>
            <div class="project-links">
              ${
                proj.githubUrl && proj.githubUrl !== "#"
                  ? `<a href="${proj.githubUrl}" target="_blank" class="proj-link" title="View Code">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                    </a>`
                  : ""
              }
              ${
                proj.liveUrl && proj.liveUrl !== "#"
                  ? `<a href="${proj.liveUrl}" target="_blank" class="proj-link" title="Live Demo">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                    </a>`
                  : ""
              }
            </div>
          </div>
          <p class="project-desc">${escapeHtml(proj.description)}</p>
        </div>
        <div class="project-tags">
          ${proj.tags
            .map((tag) => `<span class="project-tag">${escapeHtml(tag)}</span>`)
            .join("")}
        </div>
      </div>`
    )
    .join("");

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:          ${t.bg};
      --surface:     ${t.surface};
      --surface-h:   ${t.surfaceHover};
      --border:      ${t.border};
      --border-h:    ${t.borderHover};
      --text:        ${t.text};
      --muted:       ${t.textMuted};
      --faint:       ${t.textFaint};
      --accent:      ${t.accent};
      --accent-glow: ${t.accentGlow};
      --accent-text: ${t.accentText};
      --grad-a:      ${t.gradientA};
      --grad-b:      ${t.gradientB};
      --nav-bg:      ${t.navBg};
      --footer-bg:   ${t.footerBg};
      --dot:         ${t.timelineDot};
      --tag-bg:      ${t.tagBg};
      --tag-text:    ${t.tagText};
      --tag-border:  ${t.tagBorder};
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: ${t.bodyFont};
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    a { color: inherit; text-decoration: none; }

    /* ── NAV ── */
    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 50;
      background: var(--nav-bg);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }
    .nav-inner {
      max-width: 1024px; margin: 0 auto;
      padding: 0 24px; height: 64px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .nav-brand {
      font-family: ${t.headingFont};
      font-size: 17px; font-weight: 700;
      letter-spacing: -0.02em;
      transition: opacity .15s;
    }
    .nav-brand:hover { opacity: .75; }
    .nav-links {
      display: flex; gap: 32px; align-items: center;
    }
    .nav-links a {
      font-size: 13.5px; font-weight: 600;
      color: var(--muted); letter-spacing: .01em;
      transition: color .15s, opacity .15s;
    }
    .nav-links a:hover { color: var(--accent); opacity: 1; }
    .nav-cta {
      padding: 8px 20px; border-radius: 10px;
      background: linear-gradient(135deg, var(--grad-a), var(--grad-b));
      color: #fff !important; font-weight: 700 !important; font-size: 13px !important;
      box-shadow: 0 4px 14px var(--accent-glow);
      transition: opacity .15s, transform .15s !important;
    }
    .nav-cta:hover { opacity: .9 !important; transform: translateY(-1px); }

    /* ── HERO ── */
    header.hero {
      padding: 148px 24px 88px;
      max-width: 1024px; margin: 0 auto;
      min-height: 75vh; display: flex; flex-direction: column; justify-content: center;
    }
    .hero-eyebrow {
      font-size: 11px; font-weight: 700; letter-spacing: .18em;
      text-transform: uppercase; color: var(--accent-text); margin-bottom: 18px;
    }
    .hero-h1 {
      font-family: ${t.headingFont};
      font-size: clamp(2.4rem, 5vw, 4rem);
      font-weight: 800; line-height: 1.07;
      letter-spacing: -0.03em; margin-bottom: 22px;
    }
    .hero-accent { color: var(--accent-text); }
    .hero-sub {
      font-size: 18px; color: var(--muted);
      font-weight: 400; line-height: 1.65;
      max-width: 600px; margin-bottom: 38px;
    }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px; border-radius: 12px;
      background: linear-gradient(135deg, var(--grad-a), var(--grad-b));
      color: #fff; font-weight: 700; font-size: 14px;
      box-shadow: 0 6px 20px var(--accent-glow);
      transition: opacity .15s, transform .2s;
    }
    .btn-primary:hover { opacity: .9; transform: translateY(-2px); }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px; border-radius: 12px;
      border: 1.5px solid var(--border); color: var(--text);
      font-weight: 600; font-size: 14px; background: var(--surface);
      transition: border-color .15s, transform .2s, background .15s;
    }
    .btn-secondary:hover { border-color: var(--border-h); background: var(--surface-h); transform: translateY(-2px); }
    .social-links { display: flex; gap: 16px; margin-left: 4px; }
    .social-links a {
      color: var(--muted); transition: color .15s, opacity .15s;
      display: flex; align-items: center;
    }
    .social-links a:hover { color: var(--accent); }

    /* ── SECTION DIVIDER ── */
    section { border-top: 1px solid var(--border); }

    /* ── ABOUT ── */
    section.about { padding: 96px 24px; }
    .about-inner { max-width: 1024px; margin: 0 auto; display: grid; grid-template-columns: 1fr 2fr; gap: 48px; align-items: start; }
    .section-heading { font-family: ${t.headingFont}; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.025em; margin-bottom: 14px; }
    .heading-bar { width: 56px; height: 4px; border-radius: 99px; background: linear-gradient(90deg, var(--grad-a), var(--grad-b)); }
    .about-bio { font-size: 16.5px; color: var(--muted); line-height: 1.75; margin-bottom: 24px; }
    .contact-box {
      padding: 20px 22px; border-radius: 14px;
      border: 1px solid var(--border); background: var(--surface);
      display: flex; align-items: center; gap: 16px;
    }
    .contact-icon { color: var(--accent); flex-shrink: 0; }
    .contact-label { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; color: var(--faint); font-weight: 700; margin-bottom: 4px; }
    .contact-email { font-size: 14px; font-weight: 700; color: var(--text); transition: color .15s; }
    .contact-email:hover { color: var(--accent); }

    /* ── SKILLS ── */
    section.skills { padding: 96px 24px; }
    .skills-inner { max-width: 1024px; margin: 0 auto; }
    .section-heading-center { font-family: ${t.headingFont}; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.025em; text-align: center; margin-bottom: 12px; }
    .section-sub { text-align: center; color: var(--muted); font-size: 14px; margin-bottom: 48px; }
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .skill-card {
      padding: 24px; border-radius: 18px;
      background: var(--surface); border: 1px solid var(--border);
      transition: border-color .2s, background .2s, transform .2s, box-shadow .2s;
    }
    .skill-card:hover { border-color: var(--border-h); background: var(--surface-h); transform: translateY(-3px); box-shadow: 0 8px 28px var(--accent-glow); }
    .skill-category { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--accent-text); margin-bottom: 16px; }
    .skill-tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-tag {
      font-size: 12px; padding: 5px 12px; border-radius: 8px;
      background: var(--tag-bg); color: var(--tag-text); border: 1px solid var(--tag-border);
      font-weight: 500; transition: opacity .15s;
    }
    .skill-tag:hover { opacity: .8; }

    /* ── EXPERIENCE ── */
    section.experience { padding: 96px 24px; }
    .exp-inner { max-width: 1024px; margin: 0 auto; display: grid; grid-template-columns: 1fr 2fr; gap: 48px; }
    .exp-sidebar p { font-size: 13.5px; color: var(--muted); line-height: 1.7; margin-top: 14px; }
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-item { position: relative; padding-left: 32px; padding-bottom: 36px; border-left: 2px solid var(--border); }
    .timeline-item:last-child { padding-bottom: 0; border-left-color: transparent; }
    .timeline-dot {
      position: absolute; left: -8px; top: 6px;
      width: 14px; height: 14px; border-radius: 50%;
      background: var(--dot); border: 2.5px solid var(--bg);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .timeline-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
    .exp-role { font-size: 16.5px; font-weight: 700; line-height: 1.3; color: var(--text); }
    .exp-company { font-size: 13px; color: var(--muted); font-weight: 500; margin-top: 2px; }
    .exp-dates {
      font-size: 11px; font-weight: 700; font-family: monospace;
      padding: 4px 12px; border-radius: 99px;
      background: var(--tag-bg); color: var(--accent-text); border: 1px solid var(--tag-border);
      white-space: nowrap; flex-shrink: 0;
    }
    .exp-desc { font-size: 14px; color: var(--muted); line-height: 1.75; margin-top: 10px; }

    /* ── PROJECTS ── */
    section.projects { padding: 96px 24px; }
    .projects-inner { max-width: 1024px; margin: 0 auto; }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 22px; }
    .project-card {
      padding: 26px; border-radius: 18px;
      background: var(--surface); border: 1px solid var(--border);
      display: flex; flex-direction: column; justify-content: space-between;
      transition: border-color .2s, background .2s, transform .2s, box-shadow .2s;
    }
    .project-card:hover { border-color: var(--border-h); background: var(--surface-h); transform: translateY(-4px); box-shadow: 0 10px 32px var(--accent-glow); }
    .project-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .project-title { font-size: 17px; font-weight: 700; line-height: 1.3; color: var(--text); }
    .project-links { display: flex; gap: 10px; flex-shrink: 0; }
    .proj-link { color: var(--muted); transition: color .15s; display: flex; align-items: center; }
    .proj-link:hover { color: var(--accent); }
    .proj-link svg { stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .proj-link svg[viewBox="0 0 24 24"]:first-of-type { fill: currentColor; stroke: none; }
    .project-desc { font-size: 13.5px; color: var(--muted); line-height: 1.75; margin-bottom: 20px; }
    .project-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; }
    .project-tag {
      font-size: 10.5px; font-weight: 700; font-family: monospace;
      padding: 3px 9px; border-radius: 6px;
      background: var(--tag-bg); color: var(--tag-text); border: 1px solid var(--tag-border);
    }

    /* ── CONTACT ── */
    section.contact { padding: 96px 24px; }
    .contact-inner { max-width: 1024px; margin: 0 auto; text-align: center; }
    .contact-h2 {
      font-family: ${t.headingFont};
      font-size: clamp(2rem, 4.5vw, 3.5rem); font-weight: 800;
      letter-spacing: -0.03em; margin-bottom: 18px;
    }
    .contact-blurb { font-size: 16.5px; color: var(--muted); max-width: 520px; margin: 0 auto 40px; line-height: 1.7; }
    .contact-actions { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }

    /* ── FOOTER ── */
    footer {
      background: var(--footer-bg); border-top: 1px solid var(--border);
      padding: 40px 24px; text-align: center;
    }
    .footer-inner { max-width: 1024px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
    .footer-inner p { font-size: 12px; color: var(--faint); }

    /* ── UTILS ── */
    .hover-lift { transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s; }

    @media (max-width: 680px) {
      .nav-links { display: none; }
      .about-inner, .exp-inner { grid-template-columns: 1fr; gap: 28px; }
    }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(content.fullName)} — Portfolio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${t.googleFontUrl}" rel="stylesheet">
  <style>${css}</style>
</head>
<body>

  <!-- NAV -->
  <nav>
    <div class="nav-inner">
      <a href="#" class="nav-brand">${escapeHtml(content.fullName)}</a>
      <div class="nav-links">
        <a href="#about">About</a>
        <a href="#skills">Skills</a>
        <a href="#experience">Experience</a>
        <a href="#projects">Projects</a>
        <a href="#contact" class="nav-cta">Get in Touch</a>
      </div>
    </div>
  </nav>

  <!-- HERO -->
  <header class="hero">
    <p class="hero-eyebrow">Personal Portfolio</p>
    <h1 class="hero-h1">
      Hi, I'm <span class="hero-accent">${escapeHtml(content.fullName)}</span>.<br>
      ${escapeHtml(content.headline)}
    </h1>
    <p class="hero-sub">${escapeHtml(content.subheading)}</p>
    <div class="hero-actions">
      <a href="#projects" class="btn-primary">Explore Projects</a>
      <a href="#contact" class="btn-secondary">Let's Talk</a>
      <div class="social-links">
        ${
          content.linkedinUrl && content.linkedinUrl !== "#"
            ? `<a href="${content.linkedinUrl}" target="_blank" title="LinkedIn">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>`
            : ""
        }
        ${
          content.githubUrl && content.githubUrl !== "#"
            ? `<a href="${content.githubUrl}" target="_blank" title="GitHub">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>`
            : ""
        }
      </div>
    </div>
  </header>

  <!-- ABOUT -->
  <section class="about" id="about">
    <div class="about-inner">
      <div>
        <h2 class="section-heading">About Me</h2>
        <div class="heading-bar"></div>
      </div>
      <div>
        <p class="about-bio">${escapeHtml(content.aboutMe)}</p>
        <div class="contact-box">
          <div class="contact-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <p class="contact-label">Direct Contact</p>
            <a href="mailto:${content.email}" class="contact-email">${escapeHtml(content.email)}</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SKILLS -->
  <section class="skills" id="skills">
    <div class="skills-inner">
      <h2 class="section-heading-center">Core Expertise</h2>
      <p class="section-sub">Technologies and domains I excel in.</p>
      <div class="skills-grid">
        ${skillsHtml}
      </div>
    </div>
  </section>

  <!-- EXPERIENCE -->
  <section class="experience" id="experience">
    <div class="exp-inner">
      <div class="exp-sidebar">
        <h2 class="section-heading">Professional History</h2>
        <div class="heading-bar" style="margin-bottom:16px"></div>
        <p>A chronological timeline of my career progression, roles, and major contributions.</p>
      </div>
      <div class="timeline">
        ${experienceHtml}
      </div>
    </div>
  </section>

  <!-- PROJECTS -->
  <section class="projects" id="projects">
    <div class="projects-inner">
      <h2 class="section-heading-center">Featured Projects</h2>
      <p class="section-sub">Applications, tools, and libraries I've designed and built.</p>
      <div class="projects-grid">
        ${projectsHtml}
      </div>
    </div>
  </section>

  <!-- CONTACT -->
  <section class="contact" id="contact">
    <div class="contact-inner">
      <h2 class="contact-h2">Let's Work Together</h2>
      <p class="contact-blurb">
        I'm always open to discussing new projects, creative ideas, or opportunities to be part of something great.
      </p>
      <div class="contact-actions">
        <a href="mailto:${content.email}" class="btn-primary hover-lift">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Send me an Email
        </a>
      </div>
      <p style="margin-top:20px;font-size:13px;color:var(--faint);">${escapeHtml(content.email)}</p>
    </div>
  </section>

  <!-- FOOTER -->
  <footer>
    <div class="footer-inner">
      <p>&copy; ${new Date().getFullYear()} ${escapeHtml(content.fullName)}. All rights reserved.</p>
      <p>Built with <span style="color:#f43f5e">&#9829;</span> and ResumeLens.</p>
    </div>
  </footer>

  <script>
    // Smooth scroll for anchor links inside iframe
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = 64;
          const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  </script>
</body>
</html>`;
}
