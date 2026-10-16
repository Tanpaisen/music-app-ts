"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { usePlayer } from "@/components/player/PlayerProvider";
import type { AlbumDetail, AlbumTrack, Paged } from "@/types/album";

type DetailPayload = { album: AlbumDetail; songs: AlbumTrack[] };
type Details = Paged<DetailPayload>;

export default function AlbumDetailPage({ params }: { params: { albumSlug: string } }) {
  const slug = params.albumSlug;
  const player = usePlayer();
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [songs, setSongs] = useState<AlbumTrack[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [albumQueue, setAlbumQueue] = useState<AlbumTrack[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (requested: number, signal?: AbortSignal) => {
    if (requested === 1) setLoading(true); else setMoreLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/albums/${encodeURIComponent(slug)}?page=${requested}&limit=20`, { cache: "no-store", signal });
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as Details;
      if (signal?.aborted) return;
      setAlbum(json.data.album);
      setSongs(prev => requested === 1 ? json.data.songs : [...prev, ...json.data.songs.filter(s => !prev.some(old => old._id === s._id))]);
      setPage(requested); setTotalPages(json.pagination.totalPages); setTotal(json.pagination.total);
    } catch (err) {
      if (!signal?.aborted) { console.error("[albums/detail]", err); setError("Không thể tải chi tiết album."); }
    } finally {
      if (!signal?.aborted) { setLoading(false); setMoreLoading(false); }
    }
  }, [slug]);
  useEffect(() => {
    const c = new AbortController();setAlbum(null);setSongs([]);setNotFound(false);setPage(1);void load(1, c.signal);
    return () => c.abort();
  }, [load]);

  // Chuẩn bị queue ở nền trước khi người dùng nhấn Play. Gọi audio.play() ngay trong click
  // để tránh trình duyệt chặn autoplay khi có await/fetch ở giữa thao tác click.
  useEffect(() => {
    const controller = new AbortController();
    setAlbumQueue([]);
    setQueueLoading(true);
    const prepare = async () => {
      try {
        let list: AlbumTrack[] = [];
        let nextPage = 1;
        let totalPages = 1;
        do {
          const response = await fetch(`/api/albums/${encodeURIComponent(slug)}?page=${nextPage}&limit=50`, {
            cache: "no-store", signal: controller.signal,
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const json = await response.json() as Details;
          list.push(...json.data.songs);
          totalPages = json.pagination.totalPages;
          nextPage++;
        } while (nextPage <= totalPages && nextPage <= 20);
        if (!controller.signal.aborted) setAlbumQueue(list.filter(song => Boolean(song.audio)));
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("[albums/queue]", err);
          setError("Không chuẩn bị được danh sách phát của album.");
        }
      } finally {
        if (!controller.signal.aborted) setQueueLoading(false);
      }
    };
    void prepare();
    return () => controller.abort();
  }, [slug]);

  const startAlbum = (songId?: string) => {
    if (!albumQueue.length) return;
    const index = songId ? albumQueue.findIndex(song => song._id === songId) : 0;
    player.playCollection(albumQueue, Math.max(0, index));
  };

  return (
    <div className="flex min-h-screen bg-base text-ink">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
        <Link href="/albums" className="mb-7 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><i className="bi bi-arrow-left" /> Album</Link>
        {loading && <p role="status" className="text-muted">Đang tải album...</p>}
        {notFound && !loading && <p role="alert" className="text-muted">Album không tồn tại hoặc đang được ẩn.</p>}
        {error && <p role="alert" className="my-4 rounded-xl border border-red-700/50 p-3 text-sm text-red-300">{error}</p>}
        {album && <>
          <section className="mb-9 flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="aspect-square w-full max-w-[250px] shrink-0 overflow-hidden rounded-2xl bg-raised shadow-lg sm:w-[220px]">
              {album.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={album.avatar} alt={`Bìa ${album.title}`} className="h-full w-full object-cover" />
              ) : <div className="flex h-full items-center justify-center"><i className="bi bi-vinyl text-6xl text-muted" aria-hidden="true" /></div>}
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-amber">Album</p>
              <h1 className="mt-2 break-words text-3xl font-bold sm:text-4xl">{album.title}</h1>
              <p className="mt-3 text-muted">{album.singer?.fullName || "Nhiều nghệ sĩ"}{album.releaseDate ? ` · ${new Date(album.releaseDate).getUTCFullYear()}` : ""} · {total} bài hát</p>
              {album.description && <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-muted">{album.description}</p>}
              <button type="button" disabled={queueLoading || albumQueue.length === 0} onClick={() => void startAlbum()} className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-[#171717] hover:opacity-90 disabled:opacity-50">
                <i className="bi bi-play-fill text-xl" />{queueLoading ? "Đang chuẩn bị..." : "Phát album"}
              </button>
            </div>
          </section>
          <h2 className="mb-4 text-lg font-semibold">Danh sách bài hát</h2>
          {!songs.length && !loading && <p className="text-sm text-muted">Album này chưa có bài hát.</p>}
          <div className="space-y-2">
            {songs.map((song, i) => (
              <div key={song._id} className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-raised/40 p-3 transition hover:bg-raised">
                <span className="w-6 shrink-0 text-right text-xs text-muted">{i + 1}</span>
                <Link href={`/songs/detail/${encodeURIComponent(song.slug)}`} className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#222]">
                  {song.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={song.avatar} alt={song.title} className="h-full w-full object-cover" />
                  ) : <i className="bi bi-music-note flex h-full items-center justify-center text-muted" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/songs/detail/${encodeURIComponent(song.slug)}`} className="block truncate text-sm font-medium hover:text-amber">{song.title}</Link>
                  <p className="truncate text-xs text-muted">{song.singer?.fullName || album.singer?.fullName || "Chưa rõ ca sĩ"}</p>
                </div>
                <span className="hidden text-xs text-muted sm:inline">{song.listen.toLocaleString("vi-VN")} lượt nghe</span>
                <button type="button" disabled={!song.audio || queueLoading || !albumQueue.length} onClick={() => void startAlbum(song._id)} title={`Phát ${song.title}`} aria-label={`Phát ${song.title}`} className="rounded-full p-2 text-amber hover:bg-white/10 disabled:opacity-30"><i className="bi bi-play-circle text-xl" /></button>
              </div>
            ))}
          </div>
          {page < totalPages && <div className="mt-7 text-center"><button type="button" disabled={moreLoading} onClick={() => void load(page + 1)} className="rounded-full border border-line px-6 py-2 text-sm hover:border-amber disabled:opacity-50">{moreLoading ? "Đang tải..." : "Xem thêm bài hát"}</button></div>}
        </>}
      </main>
    </div>
  );
}
