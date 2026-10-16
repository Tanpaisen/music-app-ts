"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import CatalogSongList, { type CatalogSong } from "@/components/catalog/CatalogSongList";

export default function LikedPage() {
  const [songs, setSongs] = useState<CatalogSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/catalog/liked", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        if (response.status === 401) { setUnauthorized(true); return; }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json: { data?: CatalogSong[] } = await response.json();
        if (!controller.signal.aborted) setSongs(json.data ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("[Liked]", err);
        setError("Không thể tải danh sách đã thích.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return <div className="flex min-h-screen bg-[#0a0a0a] text-[#eee]">
    <Sidebar />
    <main className="min-w-0 flex-1 px-5 py-8 sm:px-10">
      <p className="mb-2 text-xs uppercase tracking-widest text-[#f2a65a]">Thư viện cá nhân</p>
      <h1 className="mb-8 text-3xl font-semibold">Bài hát đã thích</h1>
      {loading ? <p role="status" className="text-sm text-[#aaa]">Đang tải danh sách...</p> : unauthorized ? (
        <div className="rounded-xl border border-[#333] bg-[#171717] p-6">
          <p className="mb-4 text-sm text-[#aaa]">Vui lòng đăng nhập để xem những bài hát bạn đã thích.</p>
          <Link href="/auth/login" className="text-sm text-[#f2a65a] underline">Đăng nhập</Link>
        </div>
      ) : error ? <p role="alert" className="text-sm text-red-300">{error}</p>
        : songs.length ? <CatalogSongList songs={songs} />
          : <p className="text-sm text-[#aaa]">Bạn chưa Like bài hát nào. <Link href="/search" className="text-[#f2a65a] underline">Khám phá nhạc</Link></p>}
    </main>
  </div>;
}
