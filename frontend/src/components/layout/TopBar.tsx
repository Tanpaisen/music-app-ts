"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SongSuggestion {
  _id: string;
  title: string;
  slug: string;
  avatar?: string;
  singer?: { fullName?: string } | null;
}
interface ArtistSuggestion {
  _id: string;
  fullName: string;
  slug?: string;
  avatar?: string;
}
interface TopicSuggestion {
  _id: string;
  title: string;
  slug: string;
  avatar?: string;
}
interface PlaylistSuggestion {
  id: string;
  name: string;
  description?: string;
}
interface SearchData {
  songs: SongSuggestion[];
  artists: ArtistSuggestion[];
  topics: TopicSuggestion[];
  playlists: PlaylistSuggestion[];
}

export default function TopBar() {
  const router = useRouter();
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<SearchData | null>(null);
  const query = keyword.trim();

  // Debounce 350ms + AbortController: chỉ tìm khi dừng gõ, bỏ request cũ.
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setLoading(false);
      setError("");
      return;
    }

    const abort = new AbortController();
    setLoading(true);
    setError("");
    setResults(null);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/search/all?keyword=${encodeURIComponent(query)}`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: abort.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json: { data?: Partial<SearchData> } = await response.json();
        if (abort.signal.aborted) return;
        setResults({
          songs: json.data?.songs ?? [],
          artists: json.data?.artists ?? [],
          topics: json.data?.topics ?? [],
          playlists: json.data?.playlists ?? [],
        });
      } catch (e) {
        if (abort.signal.aborted) return;
        console.error("[TopBar] Search suggestions failed:", e);
        setError("Không tải được gợi ý. Vui lòng thử lại.");
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      abort.abort();
    };
  }, [query]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const goToResults = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.length < 2) return;
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/search?keyword=${encodeURIComponent(query)}`);
  };

  const clear = () => {
    setKeyword("");
    setResults(null);
    setError("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const total = results
    ? results.songs.length + results.artists.length + results.topics.length + results.playlists.length
    : 0;

  return (
    <header className="relative z-30 flex min-w-0 items-center justify-between gap-3 py-5 pl-16 pr-4 sm:pr-6 lg:px-10">
      <form ref={rootRef} onSubmit={goToResults} role="search" className="relative min-w-0 w-full max-w-xl">
        <div className="flex items-center rounded-full border border-line bg-panel transition-colors focus-within:border-amber/70">
          <i className="bi bi-search ml-4 shrink-0 text-sm text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={keyword}
            onFocus={() => setOpen(true)}
            onChange={(event) => { setKeyword(event.target.value); setOpen(true); }}
            onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
            placeholder="Tìm bài hát, ca sĩ, chủ đề..."
            aria-label="Tìm nhạc"
            aria-expanded={open && query.length >= 2}
            aria-controls="tmus-home-search-suggestions"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-ink placeholder:text-muted outline-none [appearance:textfield] [&::-webkit-search-cancel-button]:hidden"
          />
          {keyword && (
            <button type="button" onClick={clear} aria-label="Xóa từ khóa" className="shrink-0 px-2 text-muted hover:text-ink">
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          )}
          <button type="submit" disabled={query.length < 2} className="mr-1 rounded-full bg-amber px-3 py-2 text-xs font-semibold text-[#171717] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4">
            Tìm
          </button>
        </div>

        {open && query.length >= 2 && (
          <div
            id="tmus-home-search-suggestions"
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,480px)] overflow-y-auto rounded-2xl border border-line bg-panel p-2 shadow-2xl"
            aria-label="Gợi ý tìm kiếm"
          >
            {loading && <p className="px-3 py-4 text-sm text-muted" role="status">Đang tìm trên Meilisearch...</p>}
            {!loading && error && <p className="px-3 py-4 text-sm text-red-400" role="alert">{error}</p>}
            {!loading && !error && results && total === 0 && <p className="px-3 py-4 text-sm text-muted">Không có kết quả phù hợp.</p>}

            {!loading && !error && results && (
              <>
                {results.songs.length > 0 && (
                  <section aria-label="Bài hát gợi ý">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Bài hát</p>
                    {results.songs.slice(0, 5).map((song) => (
                      <Link
                        key={song._id}
                        href={`/songs/detail/${encodeURIComponent(song.slug)}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-raised"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-raised">
                          {song.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={song.avatar} alt="" className="h-full w-full object-cover" />
                          ) : <i className="bi bi-music-note text-muted" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-ink">{song.title}</span>
                          <span className="block truncate text-xs text-muted">{song.singer?.fullName ?? "Bài hát"}</span>
                        </span>
                      </Link>
                    ))}
                  </section>
                )}

                {results.artists.length > 0 && (
                  <section aria-label="Ca sĩ gợi ý">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Ca sĩ</p>
                    {results.artists.slice(0, 3).map((artist) => (
                      <Link
                        key={artist._id}
                        href={`/artists/${encodeURIComponent(artist.slug || artist._id)}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-raised"
                      >
                        <i className="bi bi-mic shrink-0 text-muted" aria-hidden="true" />
                        <span className="truncate">{artist.fullName}</span>
                      </Link>
                    ))}
                  </section>
                )}

                {results.topics.length > 0 && (
                  <section aria-label="Chủ đề gợi ý">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Chủ đề</p>
                    {results.topics.slice(0, 3).map((topic) => (
                      <Link
                        key={topic._id}
                        href={`/topics/${encodeURIComponent(topic.slug)}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-raised"
                      >
                        <i className="bi bi-grid shrink-0 text-muted" aria-hidden="true" />
                        <span className="truncate">{topic.title}</span>
                      </Link>
                    ))}
                  </section>
                )}

                {results.playlists.length > 0 && (
                  <section aria-label="Playlist của tôi gợi ý">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Playlist của tôi</p>
                    {results.playlists.slice(0, 3).map((playlist) => (
                      <Link
                        key={playlist.id}
                        href={`/playlists/${encodeURIComponent(playlist.id)}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-raised"
                      >
                        <i className="bi bi-music-note-list shrink-0 text-muted" aria-hidden="true" />
                        <span className="truncate">{playlist.name}</span>
                      </Link>
                    ))}
                  </section>
                )}
                <button
                  type="submit"
                  className="mt-2 block w-full rounded-lg border-t border-line px-3 py-3 text-left text-sm font-medium text-amber hover:bg-raised"
                >
                  Xem tất cả kết quả cho “{query}” <i className="bi bi-arrow-right ml-1" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )}
      </form>

      <div className="flex shrink-0 items-center gap-3">
        <button type="button" className="hidden items-center rounded-full border border-amber/40 px-4 py-2 text-xs font-medium tracking-wide text-amber transition-colors hover:bg-amber/10 md:inline-flex">
          Nâng cấp Premium
        </button>
        <button type="button" className="hidden text-muted hover:text-ink sm:block" aria-label="Thông báo">
          <i className="bi bi-bell text-lg" aria-hidden="true" />
        </button>
        <div className="hidden h-9 w-9 overflow-hidden rounded-full bg-raised ring-1 ring-line sm:block" aria-hidden="true" />
      </div>
    </header>
  );
}
