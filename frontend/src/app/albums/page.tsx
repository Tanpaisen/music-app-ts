"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import type { AlbumSummary, Paged } from "@/types/album";

export default function AlbumsPage() {
  const [items, setItems] = useState<AlbumSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (requested: number, signal?: AbortSignal) => {
    if (requested === 1) setLoading(true); else setMoreLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/albums?page=${requested}&limit=12`, { cache: "no-store", signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as Paged<AlbumSummary[]>;
      if (signal?.aborted) return;
      setItems(prev => requested === 1 ? json.data : [...prev, ...json.data.filter(a => !prev.some(b => b._id === a._id))]);
      setPage(requested);
      setTotalPages(json.pagination.totalPages);
    } catch (err) {
      if (!signal?.aborted) { console.error("[albums]", err); setError("Không tải được album. Kiểm tra kết nối backend."); }
    } finally {
      if (!signal?.aborted) { setLoading(false); setMoreLoading(false); }
    }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(1, controller.signal); return () => controller.abort(); }, [load]);
  return (
    <div className="flex min-h-screen bg-base text-ink">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-amber">Tmus · Bộ sưu tập</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Khám phá Album</h1>
          <p className="mt-3 text-sm text-muted">Các album của nghệ sĩ, được quản lý riêng với Chủ đề và Playlist.</p>
        </div>
        {loading && <p role="status" className="text-muted">Đang tải album...</p>}
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-700/50 p-4 text-red-300">{error} <button className="ml-2 underline" onClick={() => void load(1)}>Thử lại</button></p>}
        {!loading && !error && !items.length && <p className="rounded-xl border border-line bg-raised/40 p-6 text-muted">Chưa có album. Hãy thêm từ trang Admin → Quản lý album.</p>}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {items.map(album => (
            <Link key={album._id} href={`/albums/${encodeURIComponent(album.slug || album._id)}`} className="group min-w-0 rounded-2xl border border-line bg-raised/40 p-3 transition hover:border-amber/50 hover:bg-raised">
              <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#222]">
                {album.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.avatar} alt={`Bìa album ${album.title}`} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : <i className="bi bi-vinyl text-5xl text-muted" aria-hidden="true" />}
              </div>
              <h2 className="truncate text-sm font-semibold text-ink">{album.title}</h2>
              <p className="mt-1 truncate text-xs text-muted">{album.singer?.fullName || "Nhiều nghệ sĩ"}</p>
              <p className="mt-1 text-xs text-muted">{album.songCount} bài hát{album.releaseDate ? ` · ${new Date(album.releaseDate).getUTCFullYear()}` : ""}</p>
            </Link>
          ))}
        </div>
        {page < totalPages && <div className="mt-9 text-center"><button type="button" disabled={moreLoading} onClick={() => void load(page + 1)} className="rounded-full border border-line px-6 py-2.5 text-sm hover:border-amber disabled:opacity-50">{moreLoading ? "Đang tải..." : "Xem thêm album"}</button></div>}
      </main>
    </div>
  );
}
