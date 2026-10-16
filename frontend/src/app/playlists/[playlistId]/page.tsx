"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

type Song = {
  _id: string; title: string; slug: string; avatar?: string;
  singer?: { fullName?: string } | null;
};
type Playlist = { id: string; name: string; description: string; songs: Song[] };

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = String(params.playlistId ?? "");
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const load = useCallback(async () => {
    if (!playlistId) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) { setUnauthorized(true); setPlaylist(null); return; }
      if (response.status === 404) { setPlaylist(null); setError("Playlist không tồn tại hoặc bạn không có quyền truy cập."); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const data = result.data as Playlist;
      setPlaylist(data);
      setName(data.name);
      setDescription(data.description ?? "");
      setUnauthorized(false);
    } catch (cause) {
      console.error("[PlaylistDetail/load]", cause);
      setError("Không thể tải chi tiết Playlist.");
    } finally { setLoading(false); }
  }, [playlistId]);

  useEffect(() => { void load(); }, [load]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: "PATCH", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (response.status === 401) { setUnauthorized(true); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPlaylist((p) => p ? { ...p, name: name.trim(), description: description.trim() } : p);
    } catch (cause) {
      console.error("[PlaylistDetail/save]", cause);
      setError("Không thể cập nhật Playlist.");
    } finally { setBusy(false); }
  };

  const removeSong = async (songId: string) => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/playlists/${playlistId}/songs/${songId}`, {
        method: "DELETE", credentials: "same-origin",
      });
      if (response.status === 401) { setUnauthorized(true); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPlaylist((p) => p ? { ...p, songs: p.songs.filter((s) => s._id !== songId) } : p);
    } catch (cause) {
      console.error("[PlaylistDetail/removeSong]", cause);
      setError("Không thể xóa bài hát khỏi Playlist.");
    } finally { setBusy(false); }
  };

  const deletePlaylist = async () => {
    if (busy || !window.confirm("Bạn có chắc muốn xóa Playlist này? Các bài hát gốc không bị xóa.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, { method: "DELETE", credentials: "same-origin" });
      if (response.status === 401) { setUnauthorized(true); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      router.push("/playlists");
    } catch (cause) {
      console.error("[PlaylistDetail/delete]", cause);
      setError("Không thể xóa Playlist.");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#eee]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-10 sm:px-10">
        <Link href="/playlists" className="text-sm text-[#888] hover:text-[#4ade80]">← Tất cả Playlist</Link>
        {loading ? <p className="mt-8 text-[#aaa]">Đang tải...</p> : unauthorized ? (
          <p className="mt-8 text-[#aaa]">Hãy <Link href="/auth/login" className="text-[#4ade80] underline">đăng nhập</Link> để xem Playlist này.</p>
        ) : !playlist ? <p className="mt-8 text-red-300">{error || "Không tìm thấy Playlist"}</p> : (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-3xl font-semibold">{playlist.name}</h1>
              <button type="button" disabled={busy} onClick={() => void deletePlaylist()} className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-400 hover:bg-red-900/10 disabled:opacity-50">Xóa Playlist</button>
            </div>
            <form onSubmit={(event) => void save(event)} className="my-7 max-w-2xl space-y-3 rounded-xl border border-[#282828] bg-[#131313] p-5">
              <p className="text-sm text-[#888]">Chỉnh sửa thông tin</p>
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required
                aria-label="Tên Playlist" className="w-full rounded-lg border border-[#333] bg-[#0b0b0b] px-3 py-2 text-sm outline-none focus:border-[#4ade80]" />
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={500}
                aria-label="Mô tả Playlist" className="w-full rounded-lg border border-[#333] bg-[#0b0b0b] px-3 py-2 text-sm outline-none focus:border-[#4ade80]" />
              <button type="submit" disabled={busy || !name.trim()} className="rounded-lg bg-[#4ade80] px-4 py-2 text-sm font-semibold text-[#05100a] disabled:opacity-50">{busy ? "Đang xử lý..." : "Lưu thay đổi"}</button>
            </form>
            {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
            <h2 className="mb-3 text-lg font-semibold">{playlist.songs.length} bài hát</h2>
            {playlist.songs.length === 0 ? (
              <p className="text-sm text-[#888]">Playlist đang trống. Mở một <Link className="text-[#4ade80] underline" href="/search">bài hát</Link> rồi chọn “Playlist” để thêm.</p>
            ) : <div className="space-y-2">
              {playlist.songs.map((song) => <div key={song._id} className="flex items-center gap-3 rounded-xl border border-[#282828] bg-[#141414] p-3">
                <Link href={`/songs/detail/${song.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {song.avatar ? <img src={song.avatar} alt={`Ảnh bìa ${song.title}`} className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#222]"><i className="bi bi-music-note" /></div>}
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{song.title}</p><p className="truncate text-xs text-[#888]">{song.singer?.fullName ?? "Đang cập nhật"}</p></div>
                </Link>
                <button type="button" disabled={busy} onClick={() => void removeSong(song._id)} className="rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-white/5 disabled:opacity-50">Bỏ khỏi Playlist</button>
              </div>)}
            </div>}
          </>
        )}
      </main>
    </div>
  );
}
