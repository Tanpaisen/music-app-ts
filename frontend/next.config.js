
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
        source: "/search/all",
        destination: `${BACKEND_URL}/search/all`,
      },
      {
        source: "/search/suggest",
        destination: `${BACKEND_URL}/search/suggest`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${BACKEND_URL}/api/auth/:path*`,
      },
      {
        source: "/api/catalog/:path*",
        destination: `${BACKEND_URL}/api/catalog/:path*`,
      },
      {
        source: "/api/playlists",
        destination: `${BACKEND_URL}/api/playlists`,
      },
      {
        source: "/api/playlists/:path*",
        destination: `${BACKEND_URL}/api/playlists/:path*`,
      },
      {
        source: "/api/artists/:path*",
        destination: `${BACKEND_URL}/api/artists/:path*`,
      },
      {
        source: "/api/follows/:path*",
        destination: `${BACKEND_URL}/api/follows/:path*`,
      },
      {
        source: "/api/comments/:path*",
        destination: `${BACKEND_URL}/api/comments/:path*`,
      },
      {
        source: "/api/songs/:path*",
        destination: `${BACKEND_URL}/songs/:path*`,
      }
    ];
  },
};

module.exports = nextConfig;