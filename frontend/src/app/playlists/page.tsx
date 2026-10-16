"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

type Playlist = { id: string; name: string; description: string; songCount: number; updatedAt: string };

export default function PlaylistsPage() {
  const [items, setItems] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/playlists", { cache: "no-store", credentials: "same-origin" });
      if (response.status === 401) { setUnauthorized(true); setItems([]); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setUnauthorized(false);
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (cause) {
      console.error("[Playlists]", cause);
      setError("Không thể tải danh sách Playlist.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#eee]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-10 sm:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#4ade80]">Thư viện của bạn</p>
            <h1 className="mt-2 text-3xl font-semibold">Playlist cá nhân</h1>
            <p className="mt-2 text-sm text-[#777]">Danh sách nhạc được lưu theo tài khoản của bạn.</p>
          </div>
          <Link href="/playlists/new" className="rounded-xl bg-[#4ade80] px-5 py-3 text-sm font-semibold text-[#05100a]">
            <i className="bi bi-plus-circle mr-2" />Tạo Playlist
          </Link>
        </div>
        {loading ? <p className="text-[#aaa]">Đang tải...</p> : unauthorized ? (
          <div className="rounded-xl border border-[#333] p-6 text-sm text-[#aaa]">
            Hãy <Link className="text-[#4ade80] underline" href="/auth/login?next=%2Fplaylists">đăng nhập</Link> để xem Playlist của bạn.
          </div>
        ) : (
          <>
            {error && <p role="alert" className="mb-4 text-sm text-red-400">{error} <button className="underline" onClick={() => void load()}>Thử lại</button></p>}
            {items.length === 0 && !error ? <p className="rounded-xl border border-[#292929] bg-[#131313] p-8 text-[#999]">Bạn chưa có Playlist nào. Hãy tạo Playlist đầu tiên nhé.</p> : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <Link key={item.id} href={`/playlists/${item.id}`}
                    className="rounded-xl border border-[#272727] bg-[#151515] p-5 transition-colors hover:border-[#4ade80]/50">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#202020] text-xl text-[#4ade80]">
                      <i className="bi bi-music-note-list" />
                    </div>
                    <p className="truncate text-lg font-medium">{item.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-[#777]">{item.description || "Playlist riêng của bạn"}</p>
                    <p className="mt-4 text-xs text-[#888]">{item.songCount} bài hát</p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
