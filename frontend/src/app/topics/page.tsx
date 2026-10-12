"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type Topic = {
  _id: string; title: string; slug?: string; avatar?: string;
  description?: string; categoryKey?: string;
};
type Group = { key: string; label: string; description: string; total: number; topics: Topic[] };
type GroupsResponse = { code: number; featured: Topic[]; groups: Group[] };
type CatalogResponse = { data?: Topic[]; pagination?: { page: number; totalPages: number } };

function TopicCard({ topic, hero = false }: { topic: Topic; hero?: boolean }) {
  return (
    <Link href={`/topics/${encodeURIComponent(topic.slug || topic._id)}`}
      className={`group relative block overflow-hidden rounded-xl border border-white/10 bg-[#211d2c] transition hover:-translate-y-0.5 hover:border-[#f2a65a]/60 ${hero ? "aspect-[2.7/1]" : "aspect-[1.75/1]"}`}>
      {topic.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={topic.avatar} alt={topic.title} className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/70 via-indigo-700/70 to-pink-700/50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4">
        <p className={`${hero ? "text-lg sm:text-3xl" : "text-sm sm:text-lg"} line-clamp-2 font-semibold text-white drop-shadow-lg`}>{topic.title}</p>
        {hero && topic.description && <p className="mt-1 line-clamp-2 text-xs text-white/75 sm:text-sm">{topic.description}</p>}
      </div>
    </Link>
  );
}

export default function TopicsPage() {
  const [featured, setFeatured] = useState<Topic[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [matches, setMatches] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, { items: Topic[]; page: number; totalPages: number; busy: boolean }>>({});

  const loadGroups = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/catalog/topics/groups", { cache: "no-store", signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: GroupsResponse = await response.json();
      if (signal?.aborted) return;
      setFeatured(data.featured || []); setGroups(data.groups || []);
    } catch (e) {
      if (!signal?.aborted) { console.error(e); setError("Không thể tải danh mục chủ đề. Vui lòng thử lại."); }
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void loadGroups(ac.signal);
    return () => ac.abort();
  }, [loadGroups]);

  useEffect(() => {
    const handle = window.setTimeout(() => setTerm(query.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!term) { setMatches([]); setSearching(false); return; }
    const ac = new AbortController();
    setSearching(true);
    fetch(`/api/catalog/topics?q=${encodeURIComponent(term)}&limit=36`, { signal: ac.signal, cache: "no-store" })
      .then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return (await r.json()) as CatalogResponse; })
      .then(data => { if (!ac.signal.aborted) { setMatches(data.data || []); setError(""); } })
      .catch(e => { if (!ac.signal.aborted) { console.error(e); setError("Không thể tìm chủ đề."); } })
      .finally(() => { if (!ac.signal.aborted) setSearching(false); });
    return () => ac.abort();
  }, [term]);

  const loadCategory = async (key: string, page: number) => {
    setExpanded(prev => ({ ...prev, [key]: { items: prev[key]?.items || [], page: prev[key]?.page || 0, totalPages: prev[key]?.totalPages || 1, busy: true } }));
    try {
      const r = await fetch(`/api/catalog/topics?category=${encodeURIComponent(key)}&page=${page}&limit=24`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json: CatalogResponse = await r.json();
      setExpanded(prev => {
        const old = page === 1 ? [] : (prev[key]?.items || []);
        const next = (json.data || []).filter(t => !old.some(o => o._id === t._id));
        return { ...prev, [key]: { items: [...old, ...next], page, totalPages: json.pagination?.totalPages || 1, busy: false } };
      });
    } catch (e) {
      console.error(e); setError("Không thể tải thêm chủ đề. Vui lòng thử lại.");
      setExpanded(prev => ({ ...prev, [key]: { ...prev[key], busy: false } }));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#100d18] text-[#f5f2fa]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-16 pt-7 sm:px-8 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#f2a65a]">Khám phá âm nhạc</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Chủ đề & Tâm trạng</h1>
        <p className="mt-2 text-sm text-[#b2aebf]">Khám phá âm nhạc theo cảm xúc, thể loại và hoạt động yêu thích.</p>
        <div className="mt-7 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
          <i className="bi bi-search text-[#999]" aria-hidden="true" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm chủ đề..." aria-label="Tìm chủ đề"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#999]" />
          {query && <button onClick={() => setQuery("")} aria-label="Xóa tìm kiếm" className="text-[#aaa] hover:text-white"><i className="bi bi-x-lg" /></button>}
        </div>
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-700/50 bg-red-900/10 p-4 text-sm text-red-300">{error} <button className="ml-3 underline" onClick={() => void loadGroups()}>Thử lại</button></div>}
        {term ? (
          <section className="mt-9">
            <h2 className="mb-4 text-xl font-bold">Kết quả cho “{term}”</h2>
            {searching ? <p className="text-sm text-[#aaa]">Đang tìm...</p> : matches.length ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">{matches.map(t => <TopicCard key={t._id} topic={t} />)}</div>
            ) : !error ? <p className="text-sm text-[#aaa]">Không tìm thấy chủ đề phù hợp.</p> : null}
          </section>
        ) : loading ? <p className="mt-8 text-sm text-[#aaa]">Đang tải chủ đề...</p> : (
          <>
            {featured.length > 0 && <section className="mt-9">
              <h2 className="mb-4 text-xl font-bold sm:text-2xl">Nổi bật</h2>
              <div className={`grid gap-4 ${featured.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
                <TopicCard topic={featured[0]} hero />
                {featured.length > 1 && <div className="grid grid-cols-2 gap-4">
                  {featured.slice(1, 5).map(t => <TopicCard key={t._id} topic={t} />)}
                </div>}
              </div>
            </section>}
            {groups.map(group => {
              const all = expanded[group.key];
              const items = all ? all.items : group.topics;
              return <section key={group.key} id={group.key} className="mt-12 scroll-mt-24">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div><h2 className="text-xl font-bold sm:text-2xl">{group.label}</h2><p className="mt-1 text-xs text-[#aaa]">{group.description}</p></div>
                  {group.total > 6 && <button type="button" onClick={() => void loadCategory(group.key, all?.page ? all.page + 1 : 1)}
                    disabled={Boolean(all?.busy) || (Boolean(all) && all.page >= all.totalPages)}
                    className="shrink-0 text-xs font-semibold uppercase text-[#cdb8ff] hover:text-white disabled:opacity-40">
                    {all?.busy ? "Đang tải..." : all ? (all.page < all.totalPages ? "Xem thêm" : "Đã hiển thị tất cả") : "Xem tất cả →"}
                  </button>}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                  {items.map(t => <TopicCard key={t._id} topic={t} />)}
                </div>
              </section>;
            })}
            {!groups.length && !featured.length && <div className="mt-10 rounded-xl border border-white/10 p-6 text-sm text-[#aaa]">Chưa có chủ đề đang hoạt động. Hãy thêm hoặc phân loại chủ đề trong trang quản trị.</div>}
          </>
        )}
      </main>
    </div>
  );
}
