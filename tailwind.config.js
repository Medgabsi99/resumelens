/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["DM Serif Display", "Georgia", "serif"],
        body: ["Instrument Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        paper: {
          DEFAULT: "var(--paper)",
          warm: "var(--paper-warm)",
          card: "var(--paper-card)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          bg: "var(--accent-bg)",
          border: "var(--accent-border)",
          hover: "var(--accent-hover)",
        },
        brand: {
          glow: "var(--brand-glow)",
        }
      },
      boxShadow: {
        premium: "0 10px 30px -10px var(--shadow-color)",
        glow: "0 0 20px 2px var(--brand-glow)",
      }
    },
  },
  plugins: [],
};
