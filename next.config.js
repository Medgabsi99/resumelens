/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Required for pdf-parse and mammoth to work in API routes (Node.js runtime)
    serverComponentsExternalPackages: ["pdf-parse", "mammoth"],
  },
};

module.exports = nextConfig;
