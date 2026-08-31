const path = require("path");

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com;
  font-src 'self' https://fonts.gstatic.com data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co ws: wss: https://fonts.gstatic.com data:;
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig = {
  outputFileTracingRoot: __dirname,
  turbopack: {},
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@react-pdf/renderer"],
  },
  images: {
    // Disables the /_next/image optimization endpoint (DoS surface — GHSA-h64f-5h5j-jqjh).
    // This app uses no next/image components; unoptimized: true makes the route a
    // simple pass-through with no CPU-intensive resize path exposed.
    unoptimized: true,
  },
  serverExternalPackages: ["pdf-parse", "mammoth"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      // Prevent Node.js-only modules (required by pdf-parse, mammoth, etc.)
      // from being bundled into the browser build. These are server-only packages
      // listed in serverExternalPackages above, but webpack still analyses their
      // dependency graph during compilation which triggers "Can't resolve 'fs'".
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        http: false,
        https: false,
        url: false,
        path: false,
        stream: false,
        crypto: false,
        zlib: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
