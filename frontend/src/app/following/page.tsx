"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

type SingerItem = {
  singerId: string;
  fullName: string;
  slug: string;
  avatar: string;
  followedAt: string;
};

type FollowResponse = {
  data?: SingerItem[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

export default function FollowingPage() {
  const [items, setItems] = useState<SingerItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async (nextPage = 1) => {
    if (nextPage === 1) setLoading(true);
    else setMoreLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/follows/me?page=${nextPage}&limit=20`, {
        credentials: "same-origin", cache: "no-store",
      });
      if (response.status === 401) {
        setUnauthorized(true);
        setItems([]);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: FollowResponse = await response.json();
      const nextItems = Array.isArray(result.data) ? result.data : [];
      setUnauthorized(false);
      setItems((prev) => nextPage === 1
        ? nextItems
        : [...prev, ...nextItems.filter((n) => !prev.some((p) => p.singerId === n.singerId))]);
      setPage(nextPage);
      setTotal(result.pagination?.total ?? 0);
      setTotalPages(result.pagination?.totalPages ?? 0);
    } catch (cause) {
      console.error("[Following/list]", cause);
      setError("Không thể tải danh sách nghệ sĩ theo dõi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setMoreLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const remove = async (item: SingerItem) => {
    if (removingId) return;
    setRemovingId(item.singerId);
    setError("");
    try {
      const response = await fetch(`/api/follows/singers/${item.singerId}`, {
        method: "DELETE", credentials: "same-origin",
      });
      if (response.status === 401) {
        setUnauthorized(true);
        setItems([]);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // Tải lại trang 1 để danh sách và phân trang luôn nhất quán sau khi xóa.
      await load(1);
    } catch (cause) {
      console.error("[Following/remove]", cause);
      setError("Không thể bỏ theo dõi nghệ sĩ. Vui lòng thử lại.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-10 sm:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-[#4ade80]">Thư viện cá nhân</p>
            <h1 className="text-3xl font-semibold">Nghệ sĩ đang theo dõi</h1>
            <p className="mt-2 text-sm text-[#777]">Danh sách được lưu theo tài khoản của bạn.</p>
          </div>
          {!loading && !unauthorized && (
            <span className="rounded-full border border-[#333] px-4 py-2 text-sm text-[#aaa]">{total} nghệ sĩ</span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-[#aaa]">Đang tải nghệ sĩ...</p>
        ) : unauthorized ? (
          <div className="rounded-2xl border border-[#292929] bg-[#141414] p-8">
            <p className="mb-4 text-sm text-[#aaa]">Đăng nhập để xem nghệ sĩ bạn đang theo dõi.</p>
            <Link href="/auth/login?next=%2Ffollowing" className="rounded-xl bg-[#4ade80] px-4 py-2 font-medium text-[#05100a]">Đăng nhập</Link>
          </div>
        ) : (
          <>
            {error && <p role="alert" className="mb-4 text-sm text-red-400">{error} <button type="button" className="underline" onClick={() => void load()}>Thử lại</button></p>}
            {items.length === 0 && !error ? (
              <div className="rounded-2xl border border-[#292929] bg-[#141414] p-8 text-center">
                <i className="bi bi-person-plus text-4xl text-[#888]" aria-hidden="true" />
                <p className="mt-3">Bạn chưa theo dõi nghệ sĩ nào.</p>
                <p className="mt-2 text-sm text-[#777]">Mở trang bài hát và nhấn nút Theo dõi nghệ sĩ.</p>
                <Link href="/search" className="mt-5 inline-block rounded-xl bg-[#4ade80] px-5 py-2.5 font-medium text-[#06110a]">Khám phá âm nhạc</Link>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <div key={item.singerId} className="flex items-center gap-4 rounded-xl border border-[#282828] bg-[#151515] p-4">
                    <Link href={`/artists/${encodeURIComponent(item.slug || item.singerId)}`}
                      className="flex min-w-0 flex-1 items-center gap-4 hover:text-[#4ade80]"
                      aria-label={`Xem nghệ sĩ ${item.fullName}`}>
                      {item.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.avatar} alt={`Ảnh ${item.fullName}`} className="h-14 w-14 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#252525]">
                          <i className="bi bi-person text-2xl text-[#888]" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[#ddd]">{item.fullName}</p>
                        <p className="mt-1 text-xs text-[#888]">Đang theo dõi</p>
                      </div>
                    </Link>
                    <button
                      type="button" onClick={() => void remove(item)}
                      disabled={Boolean(removingId)}
                      aria-label={`Bỏ theo dõi ${item.fullName}`}
                      className="shrink-0 rounded-lg border border-[#333] px-3 py-2 text-xs text-[#aaa] hover:border-[#4ade80] hover:text-white disabled:opacity-50"
                    >
                      {removingId === item.singerId ? "Đang xử lý..." : "Bỏ theo dõi"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {page < totalPages && (
              <div className="mt-7 text-center">
                <button type="button" onClick={() => void load(page + 1)} disabled={moreLoading}
                  className="rounded-xl border border-[#353535] px-5 py-2.5 text-sm text-[#ddd] hover:bg-[#202020] disabled:opacity-50">
                  {moreLoading ? "Đang tải..." : "Xem thêm nghệ sĩ"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
