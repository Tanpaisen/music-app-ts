/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    return [
      {
        // Bất kỳ request nào bắt đầu bằng /api/ đều chuyển hết sang Express
        source: "/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;