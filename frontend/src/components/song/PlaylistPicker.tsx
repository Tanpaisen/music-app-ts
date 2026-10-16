"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PlaylistSummary = {
  id: string;
  name: string;
  songCount: number;
  containsSong?: boolean;
};

type ListResponse = { data?: PlaylistSummary[] };
type CreateResponse = { data?: PlaylistSummary };

export default function PlaylistPicker({ songId }: { songId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/playlists?songId=${encodeURIComponent(songId)}`, {
        credentials: "same-origin", cache: "no-store",
      });
      if (response.status === 401) { setNeedsLogin(true); setItems([]); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as ListResponse;
      setItems(Array.isArray(result.data) ? result.data : []);
      setNeedsLogin(false);
    } catch (cause) {
      console.error("[PlaylistPicker/load]", cause);
      setError("Không tải được danh sách Playlist. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => { void load(); }, [load]);

  const toggleSong = async (item: PlaylistSummary) => {
    if (busyId) return;
    setBusyId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/playlists/${item.id}/songs/${songId}`, {
        method: item.containsSong ? "DELETE" : "PUT",
        credentials: "same-origin",
      });
      if (response.status === 401) { setNeedsLogin(true); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setItems((old) => old.map((p) => p.id === item.id
        ? { ...p, containsSong: Boolean(result.data?.containsSong), songCount: result.data?.songCount ?? p.songCount }
        : p));
    } catch (cause) {
      console.error("[PlaylistPicker/toggle]", cause);
      setError("Không thể thay đổi bài hát trong Playlist.");
    } finally {
      setBusyId(null);
    }
  };

  const createWithSong = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name || name.length > 80 || creating) return;
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.status === 401) { setNeedsLogin(true); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as CreateResponse;
      const id = result.data?.id;
      if (!id) throw new Error("Playlist ID missing");

      // Thêm bài vào Playlist vừa tạo; nếu lỗi, Playlist vẫn tồn tại.
      const addResponse = await fetch(`/api/playlists/${id}/songs/${songId}`, {
        method: "PUT", credentials: "same-origin",
      });
      if (!addResponse.ok) {
        await load();
        setError("Đã tạo Playlist nhưng chưa thêm được bài hát. Bạn có thể thử lại.");
        return;
      }
      setNewName("");
      setShowCreate(false);
      await load();
    } catch (cause) {
      console.error("[PlaylistPicker/create]", cause);
      setError("Không thể tạo Playlist. Vui lòng thử lại.");
    } finally {
      setCreating(false);
    }
  };

  const goLogin = () => {
    const next = window.location.pathname + window.location.search;
    router.push(`/auth/login?next=${encodeURIComponent(next)}`);
  };

  return (
    <div className="mt-2 rounded-xl border border-[#2a2a2a] bg-[#181818] p-3">
      <div className="mb-3 flex items-center justify-between gap-2 px-2">
        <p className="text-[11px] uppercase tracking-widest text-[#999]">Thêm vào Playlist cá nhân</p>
        <Link href="/playlists" className="text-xs text-[#a78bfa] hover:underline">Quản lý</Link>
      </div>
      {needsLogin ? (
        <div className="px-2 text-sm text-[#aaa]">
          Đăng nhập để sử dụng Playlist.
          <button type="button" onClick={goLogin} className="ml-2 text-[#4ade80] underline">Đăng nhập</button>
        </div>
      ) : loading ? (
        <p className="px-2 text-sm text-[#888]">Đang tải Playlist...</p>
      ) : (
        <>
          {items.length === 0 && <p className="px-2 py-2 text-sm text-[#888]">Bạn chưa có Playlist nào.</p>}
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {items.map((item) => (
              <button key={item.id} type="button" disabled={busyId !== null || creating}
                onClick={() => void toggleSong(item)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#bbb] hover:bg-[#242424] disabled:opacity-60"
                aria-pressed={Boolean(item.containsSong)}>
                <i className={`bi ${item.containsSong ? "bi-check-circle-fill text-[#4ade80]" : "bi-music-note text-[#777]"}`} />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="shrink-0 text-[11px] text-[#777]">{busyId === item.id ? "Đang lưu..." : item.containsSong ? "Đã thêm" : `${item.songCount} bài`}</span>
              </button>
            ))}
          </div>
          <div className="my-2 border-t border-[#292929]" />
          {showCreate ? (
            <form onSubmit={(event) => void createWithSong(event)} className="flex gap-2">
              <input value={newName} onChange={(event) => setNewName(event.target.value)}
                maxLength={80} placeholder="Tên Playlist mới" autoFocus
                className="min-w-0 flex-1 rounded-lg border border-[#333] bg-[#101010] px-3 py-2 text-sm text-[#eee] outline-none focus:border-[#4ade80]" />
              <button type="submit" disabled={creating || !newName.trim()}
                className="rounded-lg bg-[#4ade80] px-3 py-2 text-xs font-semibold text-[#07130b] disabled:opacity-50">
                {creating ? "Đợi..." : "Tạo & thêm"}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="text-xs text-[#aaa]">Hủy</button>
            </form>
          ) : (
            <button type="button" onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#a78bfa] hover:text-[#c4b5fd]">
              <i className="bi bi-plus-circle" /> Tạo Playlist mới
            </button>
          )}
        </>
      )}
      {error && <p role="alert" className="mt-2 px-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
