
/** @type {import('next').NextConfig} */

const BACKEND_URL = (
  process.env.API_BASE_URL ||
  "http://127.0.0.1:3001"
).replace(/\/$/, "");

console.log("[Next.js] API Backend:", BACKEND_URL);

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/search/suggest",
        destination: `${BACKEND_URL}/search/suggest`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${BACKEND_URL}/api/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;