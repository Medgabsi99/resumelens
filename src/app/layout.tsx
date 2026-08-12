import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ToastProvider from "@/components/ToastProvider";
import { ProgressProvider, RouteProgressTrigger } from "@/components/NavigationProgress";
import FetchProgressInterceptor from "@/components/FetchProgressInterceptor";
import { ContextMenuProvider } from "@/components/ContextMenu";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout is equivalent to _document; loading shared fonts here is intentional */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Serif+Display:ital@0;1&family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
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
          <ProgressProvider>
            <ContextMenuProvider>
              <RouteProgressTrigger />
              <FetchProgressInterceptor />
              <ToastProvider>{children}</ToastProvider>
            </ContextMenuProvider>
          </ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
