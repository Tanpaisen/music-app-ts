"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import FollowArtistButton from "@/components/artist/FollowArtistButton";
import { formatCompactNumber } from "@/lib/utils/format";

type Artist = {
  _id: string;
  fullName: string;
  slug: string;
  avatar: string;
  followerCount: number;
  songCount: number;
};

type Track = {
  _id: string;
  title: string;
  slug: string;
  avatar: string;
  listen: number;
  like: number;
};

type ArtistResponse = {
  data?: {
    artist: Artist;
    songs: Track[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
};

export default function ArtistDetailPage({ params }: { params: { artistSlug: string } }) {
  const artistSlug = params.artistSlug;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Track[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [moreLoading, setMoreLoading] = useState(false);

  const loadArtist = useCallback(async (nextPage: number, signal?: AbortSignal) => {
    if (nextPage === 1) setLoading(true);
    else setMoreLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/artists/${encodeURIComponent(artistSlug)}?page=${nextPage}&limit=12`,
        { cache: "no-store", signal }
      );

      if (response.status === 404) {
        setNotFound(true);
        setArtist(null);
        setSongs([]);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json: ArtistResponse = await response.json();
      if (signal?.aborted) return;
      if (!json.data) throw new Error("Thiếu dữ liệu nghệ sĩ");

      setNotFound(false);
      setArtist(json.data.artist);
      setSongs((previous) => nextPage === 1
        ? json.data!.songs
        : [...previous, ...json.data!.songs.filter(
          (candidate) => !previous.some((existing) => existing._id === candidate._id)
        )]
      );
      setPage(nextPage);
      setTotalPages(json.data.pagination.totalPages);
    } catch (cause) {
      if (signal?.aborted) return;
      console.error("[Artists/detail]", cause);
      setError("Không thể tải trang nghệ sĩ. Vui lòng thử lại.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setMoreLoading(false);
      }
    }
  }, [artistSlug]);

  useEffect(() => {
    const controller = new AbortController();
    setArtist(null);
    setSongs([]);
    setPage(1);
    setNotFound(false);
    void loadArtist(1, controller.signal);
    return () => controller.abort();
  }, [loadArtist]);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#e8e8e8]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-10">
        <Link href="/following" className="mb-8 inline-flex items-center gap-2 text-sm text-[#888] hover:text-[#4ade80]">
          <i className="bi bi-arrow-left" /> Nghệ sĩ đang theo dõi
        </Link>

        {loading && !artist ? (
          <div className="rounded-2xl bg-[#151515] p-8 text-[#aaa]">Đang tải thông tin nghệ sĩ...</div>
        ) : notFound ? (
          <div className="rounded-2xl border border-[#292929] bg-[#141414] p-8">
            <h1 className="text-2xl font-semibold">Không tìm thấy nghệ sĩ</h1>
            <Link href="/search" className="mt-4 inline-block text-sm text-[#4ade80] underline">Tìm nghệ sĩ khác</Link>
          </div>
        ) : !artist ? (
          <div className="rounded-2xl border border-[#292929] bg-[#141414] p-8">
            <p role="alert" className="mb-4 text-red-400">{error || "Không có dữ liệu nghệ sĩ"}</p>
            <button type="button" onClick={() => void loadArtist(1)} className="text-[#4ade80] underline">Thử lại</button>
          </div>
        ) : (
          <>
            <div className="mb-10 flex flex-col items-start gap-7 rounded-3xl border border-[#262626] bg-gradient-to-br from-[#1b2e22] via-[#171717] to-[#101010] p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full border-4 border-[#2b4835] bg-[#262626] shadow-xl sm:h-48 sm:w-48">
                {artist.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={artist.avatar} alt={`Ảnh nghệ sĩ ${artist.fullName}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <i className="bi bi-person-circle text-7xl text-[#888]" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4ade80]">Nghệ sĩ · Tmus</p>
                <h1 className="break-words text-3xl font-semibold sm:text-5xl">{artist.fullName}</h1>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#aaa]">
                  <span><i className="bi bi-people mr-2" />{formatCompactNumber(artist.followerCount)} người theo dõi</span>
                  <span><i className="bi bi-music-note-list mr-2" />{artist.songCount} bài hát</span>
                </div>
                <div className="mt-6">
                  <FollowArtistButton
                    key={artist._id}
                    artistId={artist._id}
                    onFollowChanged={(following) => {
                      setArtist((previous) => previous ? ({
                        ...previous,
                        followerCount: Math.max(0, previous.followerCount + (following ? 1 : -1)),
                      }) : previous);
                    }}
                  />
                </div>
              </div>
            </div>

            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-2xl font-semibold">Bài hát của nghệ sĩ</h2>
                <span className="text-sm text-[#888]">Sắp xếp theo lượt nghe</span>
              </div>

              {error && <p role="alert" className="mb-4 text-sm text-red-400">{error} <button type="button" className="underline" onClick={() => void loadArtist(page)}>Thử lại</button></p>}

              {songs.length === 0 && !error ? (
                <div className="rounded-2xl border border-[#292929] bg-[#141414] p-8 text-sm text-[#999]">
                  Nghệ sĩ chưa có bài hát công khai.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[#292929] bg-[#121212]">
                  {songs.map((song, index) => (
                    <Link
                      href={`/songs/detail/${encodeURIComponent(song.slug)}`}
                      key={song._id}
                      className="group flex items-center gap-4 border-b border-[#242424] px-4 py-3 transition-colors last:border-b-0 hover:bg-[#202020]"
                    >
                      <span className="w-6 shrink-0 text-center text-xs text-[#777]">{index + 1}</span>
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#242424]">
                        {song.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={song.avatar} alt={`Ảnh bìa ${song.title}`} className="h-full w-full object-cover" />
                        ) : (
                          <i className="bi bi-music-note flex h-full items-center justify-center text-xl text-[#666]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#ddd] group-hover:text-[#4ade80]">{song.title}</p>
                        <p className="mt-1 text-xs text-[#888]">{artist.fullName}</p>
                      </div>
                      <span className="hidden shrink-0 items-center gap-1 text-xs text-[#777] sm:inline-flex">
                        <i className="bi bi-heart" /> {formatCompactNumber(song.like)}
                      </span>
                      <span className="hidden shrink-0 items-center gap-1 text-xs text-[#777] md:inline-flex">
                        <i className="bi bi-headphones" /> {formatCompactNumber(song.listen)}
                      </span>
                      <i className="bi bi-play-circle text-xl text-[#4ade80]" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}

              {page < totalPages && (
                <div className="mt-7 text-center">
                  <button
                    type="button" onClick={() => void loadArtist(page + 1)} disabled={moreLoading}
                    className="rounded-xl border border-[#363636] px-6 py-2.5 text-sm text-[#ddd] hover:bg-[#222] disabled:opacity-50"
                  >
                    {moreLoading ? "Đang tải..." : "Xem thêm bài hát"}
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
