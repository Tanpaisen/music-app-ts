"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

type Song = {
  _id: string;
  title: string;
  slug: string;
  avatar?: string;
  listen?: number;
  singer: { fullName: string } | null;
};
type Artist = { _id: string; fullName: string; avatar?: string; slug?: string };
type Topic = { _id: string; title: string; avatar?: string; slug?: string };
type Playlist = { id: string; name: string; description?: string; songCount: number };
type Category = "all" | "songs" | "artists" | "topics" | "playlists";
type Group = "songs" | "artists" | "topics" | "playlists";
type Results = { songs: Song[]; artists: Artist[]; topics: Topic[]; playlists: Playlist[] };

type Errors = Partial<Record<Group, string>>;
const EMPTY: Results = { songs: [], artists: [], topics: [], playlists: [] };
const TABS: { id: Category; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "songs", label: "Bài hát" },
  { id: "artists", label: "Ca sĩ" },
  { id: "topics", label: "Chủ đề" },
  { id: "playlists", label: "Playlist của tôi" },
];

function listens(n?: number) {
  const value = n ?? 0;
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}
function Artwork({ src, alt, circle = false }: { src?: string; alt: string; circle?: boolean }) {
  return (
    <div className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-[#282828] ${circle ? "rounded-full" : "rounded-xl"}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <i className={`bi ${circle ? "bi-person" : "bi-music-note-beamed"} text-xl text-white/25`} aria-hidden="true" />
      )}
    </div>
  );
}
function Section({ title, children, error }: { title: string; children: React.ReactNode; error?: string }) {
  return (
    <section className="min-w-0">
      <h2 className="mb-3 text-lg font-bold text-[#f5f5f5]">{title}</h2>
      {error ? <p role="alert" className="rounded-xl border border-red-900/40 bg-red-900/10 p-4 text-sm text-red-300">{error}</p> : children}
    </section>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Category>("all");
  const [results, setResults] = useState<Results>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [loginRequired, setLoginRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolvedQuery, setResolvedQuery] = useState("");

  // Giữ từ khóa khi người dùng đến từ thanh tìm kiếm ở trang khác.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("keyword") ?? "";
    if (param) setQuery(param);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setLoading(false);
      setResults(EMPTY);
      setErrors({});
      setLoginRequired(false);
      setResolvedQuery("");
      return;
    }

    const abort = new AbortController();
    setLoading(true);
    setResolvedQuery("");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/search/all?keyword=${encodeURIComponent(q)}`, {
          cache: "no-store", credentials: "same-origin", signal: abort.signal,
        });
        if (!response.ok) throw new Error(`Tìm kiếm trả HTTP ${response.status}`);
        const json = await response.json();
        if (abort.signal.aborted) return;
        const data = json?.data ?? {};
        setResults({
          songs: Array.isArray(data.songs) ? data.songs : [],
          artists: Array.isArray(data.artists) ? data.artists : [],
          topics: Array.isArray(data.topics) ? data.topics : [],
          playlists: Array.isArray(data.playlists) ? data.playlists : [],
        });
        setLoginRequired(Boolean(json.loginRequired));
        setErrors({});
      } catch (error) {
        if (abort.signal.aborted) return;
        console.error("[Search Meili]", error);
        setResults(EMPTY);
        setErrors({
          songs: "Không tải được kết quả từ Meilisearch. Kiểm tra API và index.",
          artists: "Không tải được kết quả từ Meilisearch.",
          topics: "Không tải được kết quả từ Meilisearch.",
          playlists: "Không tải được kết quả từ Meilisearch.",
        });
      } finally {
        if (!abort.signal.aborted) {
          setResolvedQuery(q);
          setLoading(false);
        }
      }
    }, 350);

    return () => { window.clearTimeout(timer); abort.abort(); };
  }, [query]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    if (q.length >= 2) router.replace(`/search?keyword=${encodeURIComponent(q)}`, { scroll: false });
  };

  const valid = query.trim().length >= 2;
  const show = (category: Group) => tab === "all" || tab === category;
  const count = results.songs.length + results.artists.length + results.topics.length + results.playlists.length;
  const requested = tab === "all" ? count : results[tab].length;
  const tabError = tab === "all" ? false : Boolean(errors[tab]);

  return (
    <div className="flex min-h-screen bg-[#0d0f10] text-[#e8e8e8]">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="border-b border-white/10 px-5 py-5 lg:px-8">
          <form onSubmit={submit} role="search" className="flex max-w-3xl items-center gap-3 rounded-full border border-white/10 bg-[#1d1f21] px-5 py-3 focus-within:border-[#4ade80]/50">
            <i className="bi bi-search text-white/50" aria-hidden="true" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              autoComplete="off" autoFocus type="search" aria-label="Tìm kiếm âm nhạc"
              placeholder="Tìm bài hát, ca sĩ, chủ đề hoặc playlist của bạn..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" />
            <button type="submit" disabled={!valid} className="rounded-full bg-[#4ade80] px-4 py-1.5 text-xs font-semibold text-[#092011] disabled:cursor-not-allowed disabled:opacity-40">Tìm</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Loại kết quả">
            {TABS.map(item => (
              <button key={item.id} type="button" role="tab" aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${tab === item.id
                  ? "border-[#4ade80] bg-[#4ade80] font-semibold text-[#071408]"
                  : "border-white/15 text-white/65 hover:border-white/40 hover:text-white"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold">Tìm kiếm âm nhạc</h1>
            {!valid ? (
              <p className="mt-2 text-sm text-[#aaa]">Nhập ít nhất 2 ký tự để xem kết quả. Từ khóa một chữ như “t” thường cho kết quả quá rộng.</p>
            ) : (
              <p className="mt-2 text-sm text-[#999]">{loading ? "Đang tìm kiếm..." : `Kết quả cho “${resolvedQuery || query.trim()}”`}</p>
            )}
          </div>

          {valid && loading && (
            <p role="status" className="text-sm text-[#aaa]"><i className="bi bi-arrow-repeat mr-2 inline-block animate-spin" aria-hidden="true" />Đang tải kết quả từ Tmus...</p>
          )}

          {valid && !loading && (
            <>
              {show("songs") && (
                <Section title={`Bài hát (${results.songs.length})`} error={errors.songs}>
                  {results.songs.length ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      {results.songs.map(song => (
                        <Link key={song._id} href={`/songs/detail/${song.slug}`}
                          className="flex min-w-0 items-center gap-4 rounded-xl border border-white/[0.06] bg-[#17191a] p-3 transition-colors hover:border-[#4ade80]/30 hover:bg-[#1c2220]">
                          <Artwork src={song.avatar} alt={song.title} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-[#f3f3f3]">{song.title}</p>
                            <p className="mt-1 truncate text-xs text-[#999]">{song.singer?.fullName ?? "Chưa rõ ca sĩ"}</p>
                          </div>
                          <span className="shrink-0 text-xs text-[#777]"><i className="bi bi-headphones mr-1" aria-hidden="true" />{listens(song.listen)}</span>
                        </Link>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[#888]">Không có bài hát phù hợp.</p>}
                </Section>
              )}

              {show("artists") && (
                <Section title={`Ca sĩ (${results.artists.length})`} error={errors.artists}>
                  {results.artists.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {results.artists.map(artist => (
                        <Link key={artist._id} href={`/artists/${artist.slug || artist._id}`} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#17191a] p-4 hover:border-[#4ade80]/30">
                          <Artwork circle src={artist.avatar} alt={artist.fullName} />
                          <div className="min-w-0"><p className="truncate font-medium">{artist.fullName}</p><p className="text-xs text-[#888]">Nghệ sĩ</p></div>
                        </Link>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[#888]">Không có ca sĩ phù hợp.</p>}
                </Section>
              )}

              {show("topics") && (
                <Section title={`Chủ đề (${results.topics.length})`} error={errors.topics}>
                  {results.topics.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {results.topics.map(topic => (
                        <Link key={topic._id} href={`/topics/${topic.slug || topic._id}`} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#17191a] p-4 hover:border-[#4ade80]/30">
                          <Artwork src={topic.avatar} alt={topic.title} />
                          <div className="min-w-0"><p className="truncate font-medium">{topic.title}</p><p className="text-xs text-[#888]">Chủ đề âm nhạc</p></div>
                        </Link>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[#888]">Không có chủ đề phù hợp.</p>}
                </Section>
              )}

              {show("playlists") && (
                <Section title={`Playlist của tôi (${results.playlists.length})`} error={errors.playlists}>
                  {loginRequired ? (
                    <p className="text-sm text-[#aaa]">Hãy <Link href="/auth/login?next=%2Fsearch" className="text-[#4ade80] underline">đăng nhập</Link> để tìm Playlist cá nhân.</p>
                  ) : results.playlists.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {results.playlists.map(playlist => (
                        <Link key={playlist.id} href={`/playlists/${playlist.id}`} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#17191a] p-4 hover:border-[#4ade80]/30">
                          <Artwork alt={playlist.name} />
                          <div className="min-w-0"><p className="truncate font-medium">{playlist.name}</p><p className="text-xs text-[#888]">{playlist.songCount} bài hát · Playlist cá nhân</p></div>
                        </Link>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[#888]">Không có Playlist cá nhân phù hợp.</p>}
                </Section>
              )}

              {!tabError && requested === 0 && !loginRequired && Object.keys(errors).length === 0 && (
                <p role="status" className="rounded-xl border border-white/10 bg-[#17191a] p-6 text-sm text-[#aaa]">Không tìm thấy nội dung phù hợp với “{query.trim()}”. Thử tên bài hát, ca sĩ hoặc từ khóa khác.</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
