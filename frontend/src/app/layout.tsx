import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import PlayerShell from "@/components/player/PlayerShell";

const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  variable: "--font-fraunces",
  weight: ["500", "600"],
});
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Sóng - Nghe nhạc theo cách của bạn",
  description: "Trang chủ nghe nhạc: bài hát nổi bật, BXH và playlist gợi ý.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body
        className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} bg-base font-body text-ink antialiased`}
      >
        {/* bootstrap-icons giữ nguyên từ default.pug để không phải đổi icon set */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
        />
        <PlayerProvider>
          <PlayerShell>{children}</PlayerShell>
        </PlayerProvider>
      </body>
    </html>
  );
}
