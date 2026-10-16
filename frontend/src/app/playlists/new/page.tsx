"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

export default function CreatePlaylistPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/playlists", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
        credentials: "same-origin",
      });
      if (response.status === 401) {
        router.push("/auth/login?next=%2Fplaylists%2Fnew"); return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.data?.id) throw new Error("Không nhận được ID playlist");
      router.push(`/playlists/${result.data.id}`);
    } catch (cause) {
      console.error("[Playlists/create]", cause);
      setError("Không thể tạo Playlist. Vui lòng thử lại.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#eee]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-10 sm:px-10">
        <Link href="/playlists" className="text-sm text-[#888] hover:text-[#4ade80]">← Danh sách Playlist</Link>
        <h1 className="mb-8 mt-4 text-3xl font-semibold">Tạo Playlist mới</h1>
        <form onSubmit={(event) => void create(event)} className="max-w-xl space-y-5 rounded-2xl border border-[#292929] bg-[#141414] p-6">
          <label className="block text-sm text-[#ccc]">Tên Playlist
            <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80}
              placeholder="Ví dụ: Nhạc chill cuối tuần" className="mt-2 block w-full rounded-xl border border-[#333] bg-[#0d0d0d] p-3 text-[#eee] outline-none focus:border-[#4ade80]" />
          </label>
          <label className="block text-sm text-[#ccc]">Mô tả (không bắt buộc)
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={3}
              className="mt-2 block w-full rounded-xl border border-[#333] bg-[#0d0d0d] p-3 text-[#eee] outline-none focus:border-[#4ade80]" />
          </label>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={submitting || !name.trim()} className="rounded-xl bg-[#4ade80] px-5 py-3 font-semibold text-[#05100a] disabled:opacity-60">
            {submitting ? "Đang tạo..." : "Tạo Playlist"}
          </button>
        </form>
      </main>
    </div>
  );
}
