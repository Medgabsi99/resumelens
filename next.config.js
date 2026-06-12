/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Required for pdf-parse and mammoth to work in API routes (Node.js runtime)
    // NOTE: Move to top-level `serverExternalPackages` when upgrading to Next.js 15+
    serverComponentsExternalPackages: ["pdf-parse", "mammoth"],
  },
};

module.exports = nextConfig;
