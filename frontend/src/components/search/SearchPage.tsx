"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

// ── Types ──────────────────────────────────────────────────
interface Song {
  _id: string;
  title: string;
  slug: string;
  avatar: string;
  singer: { fullName: string } | null;
  listen: number;
  like: number;
}

interface Artist {
  _id: string;
  fullName: string;
  slug: string;
  avatar?: string;
}

interface Album {
  _id: string;
  title: string;
  slug: string;
  avatar?: string;
  year?: number;
  type: "Album" | "EP" | "Single";
}

interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
}

// ── Filter pills ────────────────────────────────────────────
const FILTERS = ["All", "Songs", "Artists", "Albums", "Playlists", "Podcasts"] as const;
type Filter = (typeof FILTERS)[number];

// ── Helpers ─────────────────────────────────────────────────
function formatDuration(s?: number) {
  if (!s) return "--:--";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function formatListen(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

// ── Sub-components ──────────────────────────────────────────

function SongRow({
  song,
  accent = false,
  rank,
}: {
  song: Song;
  accent?: boolean;
  rank: number;
}) {
  const [liked, setLiked] = useState(false);
  return (
    <Link
      href={`/songs/detail/${song.slug}`}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        accent
          ? "border border-[#4ade80]/15 bg-[#4ade80]/[0.06] hover:bg-[#4ade80]/[0.09]"
          : "hover:bg-white/[0.05]"
      }`}
    >
      {/* Rank */}
      <span className="w-4 shrink-0 text-center font-mono text-[11px] text-white/30">{rank}</span>

      {/* Thumb */}
      <div
        className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/[0.08]"
        style={{
          background: "linear-gradient(135deg,#0a1a12,#061020)",
        }}
      >
        {song.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={song.avatar} alt={song.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <i
              className="bi bi-music-note text-[13px]"
              style={{ color: accent ? "rgba(74,222,128,0.6)" : "rgba(255,255,255,0.2)" }}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] font-medium ${accent ? "text-[#4ade80]" : "text-white/85"}`}
        >
          {song.title}
        </p>
        <p className="truncate text-[11px] text-white/40">
          {song.singer?.fullName ?? "Đang cập nhật"}
        </p>
      </div>

      {/* Listen */}
      <span className="shrink-0 font-mono text-[12px] text-white/35">
        {formatListen(song.listen)}
      </span>

      {/* Actions */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setLiked((p) => !p);
        }}
        className={`shrink-0 p-1 text-[15px] transition-colors ${
          liked ? "text-[#f43f5e]" : "text-white/30 hover:text-white/70"
        }`}
        aria-label="Yêu thích"
      >
        <i className={`bi ${liked ? "bi-heart-fill" : "bi-heart"}`} />
      </button>
      <button
        type="button"
        onClick={(e) => e.preventDefault()}
        className="shrink-0 p-1 text-[15px] text-white/30 hover:text-white/70"
        aria-label="Tuỳ chọn"
      >
        <i className="bi bi-three-dots" />
      </button>
    </Link>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group flex flex-col items-center gap-2"
    >
      <div
        className="h-[78px] w-[78px] overflow-hidden rounded-full border-2 border-white/[0.06] transition-colors group-hover:border-[#4ade80]/40"
        style={{ background: "linear-gradient(135deg,#0a1020,#1a0a28)" }}
      >
        {artist.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artist.avatar} alt={artist.fullName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <i className="bi bi-person-circle text-[32px] text-white/20" aria-hidden="true" />
          </div>
        )}
      </div>
      <p className="max-w-[80px] text-center text-[12px] font-medium leading-snug text-white/80">
        {artist.fullName}
      </p>
      <p className="text-[10px] text-white/30">Artist</p>
    </Link>
  );
}

function AlbumCard({ album }: { album: Album }) {
  return (
    <Link href={`/albums/${album.slug}`} className="group w-[110px]">
      <div
        className="mb-2 flex h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] transition-colors group-hover:border-white/[0.2]"
        style={{ background: "linear-gradient(135deg,#051520,#0a2010)" }}
      >
        {album.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={album.avatar} alt={album.title} className="h-full w-full object-cover" />
        ) : (
          <i className="bi bi-disc text-[32px] text-white/15" aria-hidden="true" />
        )}
      </div>
      <p className="truncate text-[12px] font-medium text-white/85">{album.title}</p>
      <p className="text-[10px] text-white/35">
        {album.year} · {album.type}
      </p>
    </Link>
  );
}

// ── Mock data (thay bằng API thật) ──────────────────────────
const MOCK: SearchResults = {
  songs: [
    { _id: "1", title: "Neon Nights (Extended Mix)", slug: "neon-nights-extended-mix", avatar: "", singer: { fullName: "SynthWave Collective" }, listen: 24700, like: 1300 },
    { _id: "2", title: "Midnight Drive", slug: "midnight-drive", avatar: "", singer: { fullName: "The Night Walkers, SynthWave Collective" }, listen: 18200, like: 980 },
    { _id: "3", title: "Cybernetic Pulse", slug: "cybernetic-pulse", avatar: "", singer: { fullName: "Vivid Sonic" }, listen: 12400, like: 750 },
  ],
  artists: [
    { _id: "a1", fullName: "SynthWave Collective", slug: "synthwave-collective" },
    { _id: "a2", fullName: "Vivid Sonic", slug: "vivid-sonic" },
  ],
  albums: [
    { _id: "al1", title: "Neon Odyssey", slug: "neon-odyssey", year: 2023, type: "Album" },
    { _id: "al2", title: "Dark Matter Beats", slug: "dark-matter-beats", year: 2022, type: "EP" },
  ],
};

// ── Main component ───────────────────────────────────────────
export default function SearchPage() {
  const [query, setQuery] = useState("Neon Nights");
  const [filter, setFilter] = useState<Filter>("Songs");
  const [results, setResults] = useState<SearchResults>(MOCK);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults({ songs: [], artists: [], albums: [] }); return; }
    setLoading(true);
    try {
      // Gọi đúng route Express hiện có: GET /search/suggest?keyword=
      // Controller trả { code: 200, message: "...", songDetail: [...] }
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
      const res = await fetch(
        `${API}/search/suggest?keyword=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();

      // Map songDetail → SearchResults shape
      setResults({
        songs: (json.songDetail ?? []).map((s: any) => ({
          _id: String(s._id),
          title: s.title,
          slug: s.slug,
          avatar: s.avatar ?? "",
          singer: s.singer ? { fullName: s.singer.fullName ?? "" } : null,
          listen: s.listen ?? 0,
          like: s.like ?? 0,
        })),
        artists: [],  // search.controller chưa trả artists riêng — mở rộng sau
        albums: [],
      });
    } catch {
      // Giữ mock data nếu chưa connect được backend
    } finally {
      setLoading(false);
    }
  }, []);

  const topSong = results.songs[0];

  return (
    <div className="flex min-h-screen bg-[#0f1112]">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">

        {/* ── Topbar ── */}
        <div className="flex items-center gap-3 border-b border-white/[0.05] px-6 py-4">
          {/* Search box */}
          <div className="flex flex-1 items-center gap-2 rounded-3xl border border-white/[0.1] bg-white/[0.06] px-4 py-2">
            <i className="bi bi-search text-[15px] text-white/40" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                // Debounce 300ms — tránh spam API mỗi keystroke
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => search(val), 300);
              }}
              placeholder="Tìm bài hát, nghệ sĩ, album..."
              className="flex-1 bg-transparent text-[13px] text-white/85 placeholder-white/30 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResults({ songs: [], artists: [], albums: [] }); }}
                className="text-[13px] text-white/35 hover:text-white/70"
                aria-label="Xoá"
              >
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>

          <button
            type="button"
            className="rounded-2xl border border-white/[0.18] px-4 py-1.5 text-[12px] text-white/60 hover:border-white/40 hover:text-white/90"
          >
            Upgrade Pro
          </button>
          <button type="button" className="text-[17px] text-white/40 hover:text-white/80" aria-label="Thông báo">
            <i className="bi bi-bell" />
          </button>
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22d3ee]" />
        </div>

        {/* ── Filter bar ── */}
        <div className="flex gap-2 border-b border-white/[0.05] px-6 py-3">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-2xl px-3.5 py-1 text-[12px] font-medium transition-all ${
                filter === f
                  ? "bg-[#4ade80] text-[#050f06]"
                  : "border border-white/[0.12] text-white/45 hover:border-white/30 hover:text-white/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-white/30">
            <i className="bi bi-arrow-repeat animate-spin text-2xl" aria-hidden="true" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-6">

              {/* Top Result */}
              {topSong && (
                <div>
                  <h2 className="mb-3 text-[20px] font-bold tracking-[-0.3px] text-white">Top Result</h2>
                  <Link
                    href={`/songs/detail/${topSong.slug}`}
                    className="group block overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]"
                  >
                    {/* Thumb */}
                    <div
                      className="mb-3 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg"
                      style={{ background: "linear-gradient(135deg,#051a0d,#050d1a,#0d0520)" }}
                    >
                      {topSong.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={topSong.avatar} alt={topSong.title} className="h-full w-full object-cover" />
                      ) : (
                        <i className="bi bi-music-note-beamed text-[40px] text-[#4ade80]/20" aria-hidden="true" />
                      )}
                    </div>

                    <span className="mb-2 inline-flex rounded-xl border border-[#4ade80]/40 bg-[#4ade80]/[0.08] px-3 py-0.5 text-[10px] font-bold tracking-widest text-[#4ade80]">
                      TRENDING
                    </span>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[22px] font-extrabold leading-tight tracking-[-0.5px] text-white">
                          {topSong.title}
                        </p>
                        <p className="mt-1 text-[12px] text-white/40">
                          Song · {topSong.singer?.fullName}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => e.preventDefault()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4ade80]"
                        aria-label="Phát"
                      >
                        <i className="bi bi-play-fill text-[18px] text-[#050f06]" aria-hidden="true" />
                      </button>
                    </div>
                  </Link>
                </div>
              )}

              {/* Songs */}
              {results.songs.length > 0 && (
                <div>
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="text-[20px] font-bold tracking-[-0.3px] text-white">Songs</h2>
                    <button type="button" className="text-[12px] text-white/35 hover:text-[#4ade80]">
                      See all
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {results.songs.map((song, i) => (
                      <SongRow key={song._id} song={song} accent={i === 0} rank={i + 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* Artists */}
              {results.artists.length > 0 && (
                <div>
                  <h2 className="mb-3 text-[20px] font-bold tracking-[-0.3px] text-white">Artists</h2>
                  <div className="flex flex-wrap gap-4">
                    {results.artists.map((a) => (
                      <ArtistCard key={a._id} artist={a} />
                    ))}
                  </div>
                </div>
              )}

              {/* Albums */}
              {results.albums.length > 0 && (
                <div>
                  <h2 className="mb-3 text-[20px] font-bold tracking-[-0.3px] text-white">Albums</h2>
                  <div className="flex flex-wrap gap-3">
                    {results.albums.map((al) => (
                      <AlbumCard key={al._id} album={al} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading && query && results.songs.length === 0 && results.artists.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center py-20 text-white/25">
                  <i className="bi bi-search mb-3 text-[40px]" aria-hidden="true" />
                  <p className="text-[14px]">Không tìm thấy kết quả cho &quot;{query}&quot;</p>
                </div>
              )}

              {/* Footer */}
              <div className="col-span-2 flex items-center justify-between border-t border-white/[0.05] pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-[16px] font-extrabold text-[#4ade80]">VibeFlow</span>
                  <span className="text-[11px] text-white/20">© 2024 VibeFlow Music. All rights reserved.</span>
                </div>
                <div className="flex gap-4">
                  {["Privacy Policy", "Terms of Service", "Cookies"].map((t) => (
                    <Link key={t} href="#" className="text-[11px] text-white/20 hover:text-white/60">
                      {t}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
