"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

type FavoriteItem = {
  id: string;
  song: {
    _id: string;
    title: string;
    slug: string;
    avatar?: string;
    listen?: number;
    like?: number;
  };
  singer?: { fullName?: string; slug?: string } | null;
};

type FavoriteResponse = {
  code: number;
  data?: FavoriteItem[];
};

export default function LibraryPage() {
  const [songs, setSongs] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadSongs = useCallback(async () => {
    setLoading(true);
    setError("");
    setUnauthorized(false);
    try {
      const response = await fetch("/api/songs/favorite", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.status === 401) {
        setUnauthorized(true);
        setSongs([]);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as FavoriteResponse;
      setSongs(Array.isArray(result.data) ? result.data : []);
    } catch (cause) {
      console.error("[Library]", cause);
      setError("Không tải được danh sách bài hát đã lưu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSongs(); }, [loadSongs]);

  const removeFavorite = async (item: FavoriteItem) => {
    if (removingId) return;
    setRemovingId(item.song._id);
    setError("");
    try {
      const response = await fetch(
        `/api/songs/favorite/unfavorite/${item.song._id}`,
        { method: "PATCH", credentials: "same-origin" }
      );
      if (response.status === 401) {
        setUnauthorized(true);
        setSongs([]);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSongs((prev) => prev.filter((entry) => entry.song._id !== item.song._id));
    } catch (cause) {
      console.error("[Library/remove]", cause);
      setError("Không thể bỏ lưu bài hát. Vui lòng thử lại.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-10 sm:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#4ade80]">Thư viện cá nhân</p>
            <h1 className="text-3xl font-semibold">Bài hát đã lưu</h1>
            <p className="mt-2 text-sm text-[#777]">Những bài hát bạn lưu được đồng bộ với tài khoản.</p>
          </div>
          {!loading && !unauthorized && !error && (
            <span className="rounded-full border border-[#333] px-4 py-2 text-sm text-[#999]">
              {songs.length} bài hát
            </span>
          )}
        </div>

        {loading ? (
          <p className="py-12 text-sm text-[#aaa]">Đang tải thư viện...</p>
        ) : unauthorized ? (
          <div className="max-w-xl rounded-2xl border border-[#222] bg-[#121212] p-8">
            <p className="mb-5 text-sm text-[#aaa]">Đăng nhập để xem và quản lý bài hát đã lưu của bạn.</p>
            <Link href="/auth/login?next=%2Flibrary" className="inline-flex rounded-xl bg-[#4ade80] px-5 py-2.5 font-medium text-[#06110a]">
              Đăng nhập
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div role="alert" className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-red-500/30 px-4 py-3 text-sm text-red-300">
                {error}
                <button type="button" onClick={() => void loadSongs()} className="underline">Thử lại</button>
              </div>
            )}
            {songs.length === 0 && !error ? (
              <div className="rounded-2xl border border-[#252525] bg-[#111] p-10 text-center">
                <i className="bi bi-bookmark text-4xl text-[#777]" aria-hidden="true" />
                <p className="mt-4 text-lg">Chưa có bài hát đã lưu</p>
                <p className="mt-2 text-sm text-[#777]">Mở bài hát và nhấn biểu tượng lưu để thêm vào thư viện.</p>
                <Link href="/search" className="mt-6 inline-flex rounded-xl bg-[#4ade80] px-5 py-2.5 font-medium text-[#06110a]">
                  Khám phá bài hát
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {songs.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#121212] p-3 hover:border-[#333]">
                    <Link href={`/songs/detail/${entry.song.slug}`} className="flex min-w-0 flex-1 items-center gap-4">
                      {entry.song.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.song.avatar} alt={`Ảnh bìa ${entry.song.title}`} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#252525]">
                          <i className="bi bi-music-note text-xl text-[#888]" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#ddd]">{entry.song.title}</p>
                        <p className="mt-1 truncate text-sm text-[#777]">{entry.singer?.fullName ?? "Đang cập nhật"}</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void removeFavorite(entry)}
                      disabled={Boolean(removingId)}
                      aria-label={`Bỏ lưu ${entry.song.title}`}
                      className="shrink-0 rounded-lg px-3 py-2 text-sm text-[#a78bfa] hover:bg-white/5 disabled:opacity-50"
                    >
                      {removingId === entry.song._id ? "Đang bỏ lưu..." : "Bỏ lưu"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
