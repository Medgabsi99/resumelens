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
          DEFAULT: "#1a1a18",
          muted: "#5a5a54",
          faint: "#9a9a90",
        },
        paper: {
          DEFAULT: "#faf9f6",
          warm: "#f4f2ec",
          card: "#ffffff",
        },
        accent: {
          DEFAULT: "#c8562a",
          bg: "#fdf0eb",
          border: "#e8a080",
          hover: "#b0461f",
        },
      },
    },
  },
  plugins: [],
};
