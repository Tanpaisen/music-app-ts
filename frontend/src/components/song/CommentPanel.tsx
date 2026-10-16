"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type CommentItem = {
  id: string;
  songId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; fullName: string };
  isMine: boolean;
};

type ListResult = {
  data?: CommentItem[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

type ItemResult = { data?: CommentItem };

const PAGE_SIZE = 10;

export default function CommentPanel({
  songId,
  onCountChange,
}: {
  songId: string;
  onCountChange: (value: number) => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const goToLogin = () => {
    const next = window.location.pathname + window.location.search;
    router.push(`/auth/login?next=${encodeURIComponent(next)}`);
  };

  useEffect(() => {
    const abort = new AbortController();
    setItems([]);
    setTotal(0);
    setPage(0);
    setError("");
    setLoading(true);

    const loadFirstPage = async () => {
      try {
        const response = await fetch(
          `/api/comments/song/${encodeURIComponent(songId)}?page=1&limit=${PAGE_SIZE}`,
          { credentials: "same-origin", cache: "no-store", signal: abort.signal }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = (await response.json()) as ListResult;
        if (abort.signal.aborted) return;
        setItems(Array.isArray(result.data) ? result.data : []);
        const count = result.pagination?.total ?? 0;
        setTotal(count);
        onCountChange(count);
        setPage(1);
      } catch (cause) {
        if (abort.signal.aborted) return;
        console.error("[CommentPanel/load]", cause);
        setError("Không thể tải bình luận. Vui lòng mở lại bảng bình luận.");
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    };

    void loadFirstPage();
    return () => abort.abort();
  }, [songId, onCountChange]);

  const loadMore = async () => {
    if (moreLoading || items.length >= total || !page) return;
    setMoreLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/comments/song/${encodeURIComponent(songId)}?page=${page + 1}&limit=${PAGE_SIZE}`,
        { credentials: "same-origin", cache: "no-store" }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as ListResult;
      setItems((previous) => {
        const known = new Set(previous.map((item) => item.id));
        return [...previous, ...(result.data ?? []).filter((item) => !known.has(item.id))];
      });
      setPage(page + 1);
      const count = result.pagination?.total ?? total;
      setTotal(count);
      onCountChange(count);
    } catch (cause) {
      console.error("[CommentPanel/more]", cause);
      setError("Không tải được bình luận tiếp theo.");
    } finally {
      setMoreLoading(false);
    }
  };

  const createComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || content.length > 1000 || busyId) return;
    setBusyId("create");
    setError("");
    try {
      const response = await fetch(`/api/comments/song/${encodeURIComponent(songId)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.status === 401) { goToLogin(); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as ItemResult;
      if (!result.data) throw new Error("API không trả về bình luận");
      setItems((previous) => [result.data!, ...previous]);
      const count = total + 1;
      setTotal(count);
      onCountChange(count);
      setDraft("");
    } catch (cause) {
      console.error("[CommentPanel/create]", cause);
      setError("Không thể gửi bình luận. Vui lòng thử lại.");
    } finally {
      setBusyId(null);
    }
  };

  const saveEdit = async (commentId: string) => {
    const content = editText.trim();
    if (!content || content.length > 1000 || busyId) return;
    setBusyId(commentId);
    setError("");
    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.status === 401) { goToLogin(); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as ItemResult;
      if (!result.data) throw new Error("API không trả về bình luận");
      const updated = result.data;
      setItems((previous) => previous.map((item) => item.id === commentId ? updated : item));
      setEditId(null);
    } catch (cause) {
      console.error("[CommentPanel/edit]", cause);
      setError("Không thể sửa bình luận hoặc bạn không có quyền.");
    } finally {
      setBusyId(null);
    }
  };

  const removeComment = async (commentId: string) => {
    if (busyId || !window.confirm("Bạn muốn xóa bình luận này?")) return;
    setBusyId(commentId);
    setError("");
    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (response.status === 401) { goToLogin(); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setItems((previous) => previous.filter((item) => item.id !== commentId));
      const count = Math.max(0, total - 1);
      setTotal(count);
      onCountChange(count);
      if (editId === commentId) setEditId(null);
    } catch (cause) {
      console.error("[CommentPanel/delete]", cause);
      setError("Không thể xóa bình luận hoặc bạn không có quyền.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mt-2 rounded-xl border border-[#222] bg-[#141414] p-3" aria-label="Bình luận bài hát">
      <h2 className="mb-3 text-[11px] uppercase tracking-widest text-[#777]">Bình luận ({total})</h2>
      <form onSubmit={createComment} className="mb-4 space-y-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Viết bình luận của bạn..."
          aria-label="Nội dung bình luận"
          className="w-full resize-y rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] px-3 py-2 text-[12px] text-[#ddd] outline-none focus:border-[#4ade80]"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#777]">{draft.length}/1000 ký tự · Đăng nhập để bình luận</span>
          <button
            type="submit"
            disabled={!draft.trim() || Boolean(busyId)}
            className="rounded-lg bg-[#4ade80] px-4 py-2 text-[12px] font-semibold text-[#050f0a] disabled:opacity-40"
          >
            {busyId === "create" ? "Đang gửi..." : "Gửi bình luận"}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="mb-3 text-xs text-red-400">{error}</p>}
      {loading ? <p className="text-xs text-[#777]">Đang tải bình luận...</p> : null}
      {!loading && items.length === 0 ? (
        <p className="py-4 text-center text-xs text-[#777]">Chưa có bình luận. Hãy để lại bình luận đầu tiên!</p>
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="flex gap-2.5 border-b border-[#222] pb-3 last:border-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#223126] text-xs font-semibold text-[#4ade80]" aria-hidden="true">
              {item.author.fullName.trim().charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-medium text-[#ddd]">{item.author.fullName}</span>
                <time className="text-[10px] text-[#777]" dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString("vi-VN")}
                </time>
                {item.updatedAt !== item.createdAt && <span className="text-[10px] text-[#777]">(đã sửa)</span>}
              </div>

              {editId === item.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(event) => setEditText(event.target.value)}
                    maxLength={1000}
                    rows={2}
                    aria-label="Chỉnh sửa bình luận"
                    className="w-full rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] px-2 py-2 text-xs text-[#ddd] outline-none focus:border-[#4ade80]"
                  />
                  <div className="flex gap-3 text-[11px]">
                    <button
                      type="button"
                      disabled={!editText.trim() || Boolean(busyId)}
                      onClick={() => void saveEdit(item.id)}
                      className="text-[#4ade80] disabled:opacity-40"
                    >Lưu</button>
                    <button type="button" onClick={() => setEditId(null)} className="text-[#aaa]">Hủy</button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#bbb]">{item.content}</p>
              )}

              {item.isMine && editId !== item.id && (
                <div className="flex gap-3 text-[11px]">
                  <button type="button" className="text-[#60a5fa]" onClick={() => { setEditId(item.id); setEditText(item.content); }}>Sửa</button>
                  <button type="button" className="text-[#fb7185]" disabled={Boolean(busyId)} onClick={() => void removeComment(item.id)}>Xóa</button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {!loading && items.length < total && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={moreLoading}
          className="mt-3 w-full rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs text-[#bbb] hover:bg-[#222] disabled:opacity-40"
        >
          {moreLoading ? "Đang tải..." : "Xem thêm bình luận"}
        </button>
      )}
    </section>
  );
}
