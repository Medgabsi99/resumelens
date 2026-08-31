import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Outfit, DM_Serif_Display, DM_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ToastProvider from "@/components/ToastProvider";
import QueryProvider from "@/components/QueryProvider";
import { ProgressProvider, RouteProgressTrigger } from "@/components/NavigationProgress";
import { ContextMenuProvider } from "@/components/ContextMenu";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://resumelens.vercel.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e11" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "ResumeLens — AI Resume Reviewer",
    template: "%s | ResumeLens",
  },
  description:
    "Get honest, structured AI feedback on your resume in seconds. ATS score, keyword gaps, rewrite suggestions, cover letters, and interview prep — all in one tool.",

  keywords: [
    "resume reviewer",
    "AI resume feedback",
    "ATS checker",
    "resume score",
    "job application",
    "cover letter generator",
    "interview prep",
  ],

  authors: [{ name: "ResumeLens" }],
  creator: "ResumeLens",

  /* ── Canonical & robots ── */
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  /* ── Icons ── */
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-512.png",
    shortcut: "/icon.svg",
  },

  /* ── PWA manifest ── */
  manifest: "/manifest.webmanifest",

  /* ── Open Graph ── */
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "ResumeLens",
    title: "ResumeLens — AI Resume Reviewer",
    description:
      "Get honest, structured AI feedback on your resume in seconds. ATS score, keyword gaps, rewrite suggestions, and more.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "ResumeLens — AI Resume Reviewer",
      },
    ],
  },

  /* ── Twitter / X Card ── */
  twitter: {
    card: "summary",
    title: "ResumeLens — AI Resume Reviewer",
    description: "Get honest, structured AI feedback on your resume in seconds.",
    images: ["/icon-512.png"],
    creator: "@resumelens",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${outfit.variable} ${dmSerif.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('resumelens-theme');
                  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-paper text-ink font-body antialiased">
        <ThemeProvider>
          <QueryProvider>
            <ProgressProvider>
              <ContextMenuProvider>
                <RouteProgressTrigger />
                <ToastProvider>{children}</ToastProvider>
              </ContextMenuProvider>
            </ProgressProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
