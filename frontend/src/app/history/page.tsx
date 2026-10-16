"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

type Row = {
  listenCount: number;
  lastListenedAt: string;
  song: { _id: string; title: string; slug: string; avatar: string };
};

export default function ListeningHistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "guest" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/listening/me/top", {
      signal: controller.signal,
      credentials: "same-origin",
      cache: "no-store",
    }).then(async response => {
      if (response.status === 401) { setStatus("guest"); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json() as { data: Row[] };
      setRows(result.data || []);
      setStatus("ready");
    }).catch(error => {
      if (!controller.signal.aborted) {
        console.error("[history]", error);
        setStatus("error");
      }
    });
    return () => controller.abort();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#eee]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-10 sm:px-10">
        <p className="mb-1 text-xs uppercase tracking-widest text-[#f2a65a]">Âm nhạc dành cho bạn</p>
        <h1 className="text-3xl font-semibold">Bài hát tôi nghe nhiều</h1>
        <p className="mt-2 text-sm text-[#888]">Mỗi lần nghe đủ 30 giây được tính là một lượt. Danh sách này chỉ bạn xem được.</p>
        {status === "loading" && <p className="mt-8 text-[#888]">Đang tải lịch sử nghe...</p>}
        {status === "error" && <p className="mt-8 text-red-400">Không tải được lịch sử. Vui lòng thử lại.</p>}
        {status === "guest" && <p className="mt-8">Bạn cần <Link href="/auth/login" className="text-[#f2a65a] underline">đăng nhập</Link> để xem thống kê riêng.</p>}
        {status === "ready" && rows.length === 0 && <p className="mt-8 text-[#888]">Chưa có bài nào nghe đủ 30 giây.</p>}
        <div className="mt-8 grid max-w-4xl gap-3">
          {rows.map((item, i) => <Link href={`/songs/detail/${encodeURIComponent(item.song.slug)}`} key={item.song._id}
            className="flex items-center gap-4 rounded-xl border border-[#292929] bg-[#171717] p-3 hover:border-[#f2a65a]">
            <span className="w-6 text-center text-sm text-[#888]">{i + 1}</span>
            {item.song.avatar && <img alt={item.song.title} src={item.song.avatar} className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
            <span className="min-w-0 flex-1 truncate font-medium">{item.song.title}</span>
            <span className="text-sm text-[#f2a65a]">{item.listenCount} lượt nghe</span>
          </Link>)}
        </div>
      </main>
    </div>
  );
}
