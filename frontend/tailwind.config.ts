import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        base: "#14171F", // nền chính - than xanh đậm, không phải đen thuần
        panel: "#1B1F2B", // nền các khối/card
        raised: "#232839", // nền khi hover / nổi lên
        line: "rgba(245, 240, 232, 0.08)",
        ink: "#F5F0E8", // chữ chính - trắng ngà ấm
        muted: "#8D93A6", // chữ phụ
        amber: {
          DEFAULT: "#F2A65A",
          soft: "#F6C596",
        },
        coral: {
          DEFAULT: "#E8604C",
          soft: "#F0917F",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(242,166,90,0.35), 0 8px 30px -8px rgba(242,166,90,0.45)",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        wave1: "wave 1.1s ease-in-out infinite",
        wave2: "wave 1.1s ease-in-out infinite 0.15s",
        wave3: "wave 1.1s ease-in-out infinite 0.3s",
        wave4: "wave 1.1s ease-in-out infinite 0.45s",
      },
    },
  },
  plugins: [],
};
export default config;
