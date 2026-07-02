import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ToastProvider from "@/components/ToastProvider";
import { ProgressProvider, RouteProgressTrigger } from "@/components/NavigationProgress";
import FetchProgressInterceptor from "@/components/FetchProgressInterceptor";
import { ContextMenuProvider } from "@/components/ContextMenu";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://resumelens.vercel.app";

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
    description:
      "Get honest, structured AI feedback on your resume in seconds.",
    images: ["/icon-512.png"],
    creator: "@resumelens",
  },

  /* ── Theme ── */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e11" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
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

