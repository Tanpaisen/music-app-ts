"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import CatalogSongList, { type CatalogSong } from "@/components/catalog/CatalogSongList";

type Topic = { _id: string; title: string; slug: string; avatar?: string; description?: string };
type Payload = {
  data?: { topic: Topic; songs: CatalogSong[] };
  pagination?: { page: number; totalPages: number };
};

export default function TopicDetailPage({ params }: { params: { topicSlug: string } }) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [songs, setSongs] = useState<CatalogSong[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async (requestedPage: number, signal?: AbortSignal) => {
    if (requestedPage === 1) setLoading(true);
    else setMoreLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/catalog/topics/${encodeURIComponent(params.topicSlug)}?page=${requestedPage}&limit=15`,
        { cache: "no-store", signal });
      if (response.status === 404) {
        if (!signal?.aborted) setNotFound(true);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json: Payload = await response.json();
      if (signal?.aborted) return;
      if (!json.data) throw new Error("Empty response");
      setTopic(json.data.topic);
      setSongs(prev => requestedPage === 1 ? json.data!.songs : [
        ...prev, ...json.data!.songs.filter(song => !prev.some(item => item._id === song._id)),
      ]);
      setPage(requestedPage);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch (err) {
      if (signal?.aborted) return;
      console.error("[Topic detail]", err);
      setError("Không tải được bài hát của chủ đề. Vui lòng thử lại.");
    } finally {
      if (!signal?.aborted) { setLoading(false); setMoreLoading(false); }
    }
  }, [params.topicSlug]);

  useEffect(() => {
    const controller = new AbortController();
    setTopic(null);
    setSongs([]);
    setNotFound(false);
    void load(1, controller.signal);
    return () => controller.abort();
  }, [load]);

  return <div className="flex min-h-screen bg-[#0a0a0a] text-[#eee]">
    <Sidebar />
    <main className="min-w-0 flex-1 px-5 py-8 sm:px-10">
      <Link href="/topics" className="mb-8 inline-flex items-center gap-2 text-sm text-[#aaa] hover:text-[#f2a65a]"><i className="bi bi-arrow-left" /> Tất cả chủ đề</Link>
      {loading ? <p className="text-sm text-[#aaa]">Đang tải chủ đề...</p> : notFound ? (
        <p className="rounded-xl border border-[#333] p-6">Không tìm thấy chủ đề này.</p>
      ) : <>
        {topic && <div className="mb-8 flex items-center gap-6 rounded-2xl border border-[#292929] bg-[#171717] p-5">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#252525] sm:h-36 sm:w-36">
            {topic.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={topic.avatar} alt={`Ảnh chủ đề ${topic.title}`} className="h-full w-full object-cover" />
            ) : <i className="bi bi-grid-1x2 text-4xl text-[#888]" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-[#f2a65a]">Chủ đề</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">{topic.title}</h1>
            {topic.description && <p className="mt-2 text-sm text-[#aaa]">{topic.description}</p>}
          </div>
        </div>}
        {error && <div role="alert" className="mb-5 text-sm text-red-300">{error} <button type="button" onClick={() => void load(1)} className="underline">Thử lại</button></div>}
        <h2 className="mb-4 text-xl font-medium">Bài hát trong chủ đề</h2>
        {songs.length ? <CatalogSongList songs={songs} /> : !error && <p className="text-sm text-[#999]">Chưa có bài hát nào trong chủ đề này.</p>}
        {page < totalPages && <button type="button" disabled={moreLoading} onClick={() => void load(page + 1)}
          className="mt-6 rounded-full border border-[#444] px-6 py-2.5 text-sm text-[#ddd] hover:bg-[#222] disabled:opacity-50">
          {moreLoading ? "Đang tải..." : "Xem thêm bài hát"}
        </button>}
      </>}
    </main>
  </div>;
}
