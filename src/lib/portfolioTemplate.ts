import { PortfolioData } from "./ai";

export function generatePortfolioHtml(content: PortfolioData, theme: string): string {
  // Theme styling definitions
  let config = {
    bgClass: "bg-slate-950 text-slate-100",
    cardClass: "bg-slate-900/50 border border-slate-800/80 hover:border-violet-500/30",
    accentColor: "#8b5cf6",
    gradientClass: "from-violet-500 to-indigo-500",
    bodyFontFamily: "font-sans",
    accentGradientText: "bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400",
    navBgClass: "bg-slate-950/80 border-b border-slate-900",
    footerBgClass: "bg-slate-950 border-t border-slate-900",
    themeStyle: `
      :root {
        --accent: #8b5cf6;
        --accent-glow: rgba(139, 92, 246, 0.15);
      }
      body {
        font-family: 'Outfit', sans-serif;
      }
    `
  };

  if (theme === "minimal-light") {
    config = {
      bgClass: "bg-stone-50 text-stone-900",
      cardClass: "bg-white border border-stone-200 hover:border-stone-400 hover:shadow-md",
      accentColor: "#1c1917",
      gradientClass: "from-stone-900 to-stone-700",
      bodyFontFamily: "font-sans",
      accentGradientText: "text-stone-900",
      navBgClass: "bg-stone-50/90 border-b border-stone-200",
      footerBgClass: "bg-stone-100 border-t border-stone-200",
      themeStyle: `
        :root {
          --accent: #1c1917;
          --accent-glow: rgba(28, 25, 23, 0.08);
        }
        body {
          font-family: 'Inter', sans-serif;
        }
      `
    };
  } else if (theme === "creative-neon") {
    config = {
      bgClass: "bg-zinc-950 text-zinc-100",
      cardClass: "bg-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]",
      accentColor: "#10b981",
      gradientClass: "from-emerald-400 to-cyan-500",
      bodyFontFamily: "font-sans",
      accentGradientText: "bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400",
      navBgClass: "bg-zinc-950/80 border-b border-zinc-900",
      footerBgClass: "bg-zinc-950 border-t border-zinc-900",
      themeStyle: `
        :root {
          --accent: #10b981;
          --accent-glow: rgba(16, 185, 129, 0.12);
        }
        body {
          font-family: 'Outfit', sans-serif;
        }
      `
    };
  } else if (theme === "warm-professional") {
    config = {
      bgClass: "bg-stone-50 text-stone-900",
      cardClass: "bg-white border border-amber-100/60 shadow-sm hover:border-emerald-700/30 hover:shadow-md",
      accentColor: "#064e3b",
      gradientClass: "from-emerald-800 to-teal-950",
      bodyFontFamily: "font-serif",
      accentGradientText: "text-emerald-950",
      navBgClass: "bg-stone-50/90 border-b border-amber-100/50",
      footerBgClass: "bg-stone-100 border-t border-amber-100/50",
      themeStyle: `
        :root {
          --accent: #064e3b;
          --accent-glow: rgba(6, 78, 59, 0.08);
        }
        h1, h2, h3, .brand-font {
          font-family: 'Playfair Display', serif;
        }
        body {
          font-family: 'Inter', sans-serif;
        }
      `
    };
  }

  // Render arrays into HTML blocks safely escaping characters where necessary
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
      <div class="p-6 rounded-2xl ${config.cardClass} transition-all duration-300">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-[var(--accent)] mb-4">${escapeHtml(cat.category)}</h3>
        <div class="flex flex-wrap gap-2">
          ${cat.items
            .map(
              (item) => `
            <span class="text-xs px-3 py-1.5 rounded-lg border border-current opacity-85 hover:opacity-100 transition-opacity" style="color: var(--accent); background: var(--accent-glow);">
              ${escapeHtml(item)}
            </span>
          `
            )
            .join("")}
        </div>
      </div>
    `
    )
    .join("");

  const experienceHtml = content.experience
    .map(
      (exp, index) => `
      <div class="relative pl-8 pb-8 last:pb-0 border-l border-zinc-800/80 last:border-l-0">
        <!-- Dot -->
        <div class="absolute -left-[6.5px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-[var(--accent)] shadow-md shadow-inner"></div>
        
        <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
          <div>
            <h3 class="font-bold text-lg leading-snug">${escapeHtml(exp.role)}</h3>
            <p class="text-sm opacity-75 font-medium">${escapeHtml(exp.company)}</p>
          </div>
          <span class="text-xs font-mono font-bold px-3 py-1 rounded-full border border-current opacity-70" style="color: var(--accent); background: var(--accent-glow);">
            ${escapeHtml(exp.dates)}
          </span>
        </div>
        <p class="text-sm opacity-80 leading-relaxed mt-2">${escapeHtml(exp.description)}</p>
      </div>
    `
    )
    .join("");

  const projectsHtml = content.projects
    .map(
      (proj) => `
      <div class="p-6 rounded-2xl ${config.cardClass} flex flex-column flex-col justify-between transition-all duration-300">
        <div>
          <div class="flex justify-between items-start gap-4 mb-3">
            <h3 class="font-bold text-lg leading-snug">${escapeHtml(proj.title)}</h3>
            <div class="flex gap-2.5">
              ${
                proj.githubUrl && proj.githubUrl !== "#"
                  ? `<a href="${proj.githubUrl}" target="_blank" class="opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all" title="View Code"><i class="fab fa-github text-lg"></i></a>`
                  : ""
              }
              ${
                proj.liveUrl && proj.liveUrl !== "#"
                  ? `<a href="${proj.liveUrl}" target="_blank" class="opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all" title="Live Demo"><i class="fas fa-external-link-alt text-base"></i></a>`
                  : ""
              }
            </div>
          </div>
          <p class="text-sm opacity-85 leading-relaxed mb-5">${escapeHtml(proj.description)}</p>
        </div>
        
        <div class="flex flex-wrap gap-1.5 mt-auto">
          ${proj.tags
            .map(
              (tag) => `
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800/50 text-zinc-400 border border-zinc-800">
              ${escapeHtml(tag)}
            </span>
          `
            )
            .join("")}
        </div>
      </div>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(content.fullName)} — Personal Portfolio</title>
  
  <!-- Tailwind CSS & Icons -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap" rel="stylesheet">
  
  <style>
    ${config.themeStyle}
    .hover-lift {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
    }
    .hover-lift:hover {
      transform: translateY(-4px);
    }
  </style>
</head>
<body class="${config.bgClass} ${config.bodyFontFamily} min-h-screen selection:bg-[var(--accent)] selection:text-white transition-colors duration-300">

  <!-- Nav Header -->
  <nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md ${config.navBgClass} transition-colors duration-300">
    <div class="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
      <a href="#" class="font-bold text-lg tracking-tight hover:opacity-85 transition-opacity brand-font">
        ${escapeHtml(content.fullName)}
      </a>
      
      <!-- Desktop Links -->
      <div class="hidden sm:flex gap-8 items-center text-sm font-semibold tracking-wide">
        <a href="#about" class="opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all">About</a>
        <a href="#skills" class="opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all">Skills</a>
        <a href="#experience" class="opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all">Experience</a>
        <a href="#projects" class="opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all">Projects</a>
        <a href="#contact" class="px-4 py-2 rounded-xl text-white bg-gradient-to-r ${config.gradientClass} hover:opacity-90 transition-opacity font-medium">Get in Touch</a>
      </div>
      
      <!-- Mobile Nav Toggle -->
      <button id="navToggle" class="sm:hidden text-lg opacity-80 hover:opacity-100" aria-label="Toggle Menu">
        <i class="fas fa-bars"></i>
      </button>
    </div>
    
    <!-- Mobile Menu -->
    <div id="mobileMenu" class="hidden sm:hidden px-6 py-4 flex flex-col gap-4 border-t border-zinc-900 bg-inherit w-full">
      <a href="#about" class="py-2 text-sm opacity-80 hover:text-[var(--accent)] transition-all">About</a>
      <a href="#skills" class="py-2 text-sm opacity-80 hover:text-[var(--accent)] transition-all">Skills</a>
      <a href="#experience" class="py-2 text-sm opacity-80 hover:text-[var(--accent)] transition-all">Experience</a>
      <a href="#projects" class="py-2 text-sm opacity-80 hover:text-[var(--accent)] transition-all">Projects</a>
      <a href="#contact" class="py-2 text-sm text-[var(--accent)] font-semibold">Get in Touch</a>
    </div>
  </nav>

  <!-- Hero Section -->
  <header class="pt-36 pb-20 px-6 max-w-5xl mx-auto flex flex-col justify-center min-h-[70vh]">
    <div class="max-w-3xl">
      <span class="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-bold mb-4 block">Personal Portfolio</span>
      <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 brand-font">
        Hi, I'm <span class="${config.accentGradientText}">${escapeHtml(content.fullName)}</span>.
        <br>
        ${escapeHtml(content.headline)}
      </h1>
      <p class="text-lg sm:text-xl opacity-75 font-medium leading-relaxed mb-8 max-w-2xl">
        ${escapeHtml(content.subheading)}
      </p>
      
      <div class="flex flex-wrap gap-4 items-center">
        <a href="#projects" class="px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r ${config.gradientClass} hover:opacity-95 shadow-lg shadow-violet-500/10 hover-lift transition-all">
          Explore Projects
        </a>
        <a href="#contact" class="px-6 py-3.5 rounded-xl font-bold border border-zinc-800 bg-zinc-900/10 hover:bg-zinc-800/10 hover-lift transition-all">
          Let's Talk
        </a>
        
        <!-- Socials -->
        <div class="flex items-center gap-4 ml-2 sm:ml-4">
          ${
            content.linkedinUrl && content.linkedinUrl !== "#"
              ? `<a href="${content.linkedinUrl}" target="_blank" class="opacity-65 hover:opacity-100 hover:text-[var(--accent)] text-xl transition-all" title="LinkedIn"><i class="fab fa-linkedin"></i></a>`
              : ""
          }
          ${
            content.githubUrl && content.githubUrl !== "#"
              ? `<a href="${content.githubUrl}" target="_blank" class="opacity-65 hover:opacity-100 hover:text-[var(--accent)] text-xl transition-all" title="GitHub"><i class="fab fa-github"></i></a>`
              : ""
          }
        </div>
      </div>
    </div>
  </header>

  <!-- About Me -->
  <section id="about" class="py-24 px-6 border-t border-zinc-900/50">
    <div class="max-w-5xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
        <div class="md:col-span-1">
          <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight brand-font mb-4">About Me</h2>
          <div class="w-16 h-1 rounded bg-gradient-to-r ${config.gradientClass}"></div>
        </div>
        <div class="md:col-span-2">
          <p class="text-lg opacity-85 leading-relaxed mb-6">
            ${escapeHtml(content.aboutMe)}
          </p>
          <div class="p-6 rounded-2xl bg-zinc-900/10 border border-zinc-800/50 flex items-center gap-4">
            <div class="text-[var(--accent)] text-2xl flex-shrink-0">
              <i class="fas fa-envelope-open-text"></i>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wider text-zinc-500 font-semibold font-mono">Direct Contact</p>
              <a href="mailto:${content.email}" class="text-sm font-bold opacity-90 hover:opacity-100 hover:text-[var(--accent)] transition-all">${escapeHtml(content.email)}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Skills -->
  <section id="skills" class="py-24 px-6 border-t border-zinc-900/50">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight brand-font mb-10 text-center">Core Expertise</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${skillsHtml}
      </div>
    </div>
  </section>

  <!-- Experience -->
  <section id="experience" class="py-24 px-6 border-t border-zinc-900/50">
    <div class="max-w-5xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div class="md:col-span-1">
          <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight brand-font mb-4">Professional History</h2>
          <div class="w-16 h-1 rounded bg-gradient-to-r ${config.gradientClass} mb-6"></div>
          <p class="text-sm opacity-70 leading-relaxed max-w-xs">
            A chronological timeline of my career progression, roles, and major leadership contributions.
          </p>
        </div>
        <div class="md:col-span-2">
          <div class="flex flex-col">
            ${experienceHtml}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Projects -->
  <section id="projects" class="py-24 px-6 border-t border-zinc-900/50">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight brand-font mb-4 text-center">Featured Projects</h2>
      <p class="text-sm opacity-70 text-center max-w-md mx-auto mb-12">
        Some of the applications, services, and libraries I have conceptualized, designed, and developed.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${projectsHtml}
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section id="contact" class="py-24 px-6 border-t border-zinc-900/50">
    <div class="max-w-5xl mx-auto text-center">
      <h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight brand-font mb-6">Let's Work Together</h2>
      <p class="text-lg opacity-75 max-w-lg mx-auto leading-relaxed mb-10">
        I am always open to discussing new software development initiatives, design opportunities, or contract projects.
      </p>
      
      <a href="mailto:${content.email}" class="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r ${config.gradientClass} hover:opacity-95 shadow-xl shadow-violet-500/10 hover-lift transition-all">
        <i class="far fa-envelope"></i>
        <span>Send me an Email</span>
      </a>
      
      <div class="mt-8 flex justify-center gap-6 text-sm font-semibold opacity-70">
        ${
          content.email
            ? `<a href="mailto:${content.email}" class="hover:text-[var(--accent)] hover:opacity-100 transition-all"><i class="fas fa-envelope mr-1.5"></i>${escapeHtml(content.email)}</a>`
            : ""
        }
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 px-6 ${config.footerBgClass} text-center text-xs opacity-60">
    <div class="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
      <p>&copy; ${new Date().getFullYear()} ${escapeHtml(content.fullName)}. All rights reserved.</p>
      <p>Built with <span class="text-rose-500">&hearts;</span> and ResumeLens.</p>
    </div>
  </footer>

  <script>
    // Mobile navigation toggle
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (navToggle && mobileMenu) {
      navToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
      
      // Close menu when clicking link
      const links = mobileMenu.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.add('hidden');
        });
      });
    }

    // Smooth scroll interceptor for hash links to prevent parent/iframe route navigation issues
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
          e.preventDefault();
          if (href === '#') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            const targetElement = document.querySelector(href);
            if (targetElement) {
              // Account for fixed nav height (16 = 64px)
              const navOffset = 64;
              const elementPosition = targetElement.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - navOffset;

              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              });
            }
          }
        }
      });
    });
  </script>
</body>
</html>`;
}
