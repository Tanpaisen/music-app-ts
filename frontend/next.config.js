
/** @type {import('next').NextConfig} */

const BACKEND_URL =
  process.env.API_BASE_URL ||
  "http://localhost:3001";

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
    ];
  },
};

module.exports = nextConfig;
