"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type Entry = {
  _id: string;
  fullName?: string;
  title?: string;
  slug?: string;
  avatar?: string;
  description?: string;
};
type CatalogResponse = {
  data?: Entry[];
  pagination?: { page: number; total: number; totalPages: number };
};

export default function PublicCatalogPage({ kind }: { kind: "artists" | "topics" }) {
  const artistPage = kind === "artists";
  const label = artistPage ? "Ca sĩ" : "Chủ đề";
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [items, setItems] = useState<Entry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setTerm(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const load = useCallback(async (requestedPage: number, signal?: AbortSignal) => {
    if (requestedPage === 1) setLoading(true);
    else setMoreLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(requestedPage), limit: "12" });
      if (term) params.set("q", term);
      const response = await fetch(`/api/catalog/${kind}?${params}`, {
        credentials: "same-origin", cache: "no-store", signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json: CatalogResponse = await response.json();
      if (signal?.aborted) return;
      const next = json.data ?? [];
      setItems(previous => requestedPage === 1
        ? next
        : [...previous, ...next.filter(item => !previous.some(old => old._id === item._id))]);
      setPage(requestedPage);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch (err) {
      if (signal?.aborted) return;
      console.error(`[Catalog/${kind}]`, err);
      setError(`Không thể tải danh sách ${label.toLowerCase()}. Hãy kiểm tra kết nối backend.`);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setMoreLoading(false);
      }
    }
  }, [kind, label, term]);

  useEffect(() => {
    const controller = new AbortController();
    void load(1, controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#e8e8e8]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-10">
        <div className="mb-8">
          <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[#f2a65a]">Khám phá âm nhạc</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{artistPage ? "Khám phá ca sĩ" : "Khám phá chủ đề"}</h1>
          <p className="mt-2 text-sm text-[#999]">{artistPage
            ? "Tìm nghệ sĩ bạn yêu thích và khám phá các bài hát của họ."
            : "Nghe nhạc theo cảm xúc, thể loại và chủ đề bạn quan tâm."}</p>
        </div>

        <div className="mb-8 flex max-w-lg items-center gap-3 rounded-xl border border-[#303030] bg-[#171717] px-4 py-3">
          <i className="bi bi-search text-[#777]" aria-hidden="true" />
          <input value={query} onChange={event => setQuery(event.target.value)}
            aria-label={`Tìm ${label.toLowerCase()}`} placeholder={`Tìm ${label.toLowerCase()}...`}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#ddd] outline-none placeholder:text-[#777]" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Xóa tìm kiếm" className="text-[#777] hover:text-white"><i className="bi bi-x-lg" /></button>}
        </div>

        {loading ? <p role="status" className="text-sm text-[#999]">Đang tải {label.toLowerCase()}...</p> : (
          <>
            {error && <div role="alert" className="mb-6 rounded-xl border border-red-900 p-4 text-sm text-red-300">{error} <button type="button" onClick={() => void load(1)} className="ml-2 underline">Thử lại</button></div>}
            {items.length === 0 && !error && <p className="rounded-xl border border-[#303030] bg-[#151515] p-6 text-sm text-[#999]">Chưa tìm thấy {label.toLowerCase()} phù hợp.</p>}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {items.map(item => {
                const name = (artistPage ? item.fullName : item.title) || "Chưa cập nhật";
                const href = artistPage
                  ? `/artists/${encodeURIComponent(item.slug || item._id)}`
                  : `/topics/${encodeURIComponent(item.slug || item._id)}`;
                return (
                  <Link key={item._id} href={href} className="group min-w-0 rounded-2xl border border-[#292929] bg-[#161616] p-3 transition-colors hover:border-[#f2a65a]/40 hover:bg-[#202020]">
                    <div className={`mb-3 flex aspect-square items-center justify-center overflow-hidden bg-[#222] ${artistPage ? "rounded-full" : "rounded-xl"}`}>
                      {item.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.avatar} alt={`Ảnh ${name}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : <i className={`bi ${artistPage ? "bi-person" : "bi-music-note-beamed"} text-4xl text-[#777]`} aria-hidden="true" />}
                    </div>
                    <p className="truncate text-sm font-medium text-[#eee]">{name}</p>
                    <p className="mt-1 truncate text-xs text-[#888]">{artistPage ? "Xem nghệ sĩ" : item.description || "Xem bài hát"}</p>
                  </Link>
                );
              })}
            </div>
            {page < totalPages && (
              <div className="mt-8 text-center">
                <button type="button" disabled={moreLoading} onClick={() => void load(page + 1)}
                  className="rounded-full border border-[#444] px-6 py-2.5 text-sm text-[#ddd] hover:bg-[#222] disabled:opacity-50">
                  {moreLoading ? "Đang tải..." : `Xem thêm ${label.toLowerCase()}`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
