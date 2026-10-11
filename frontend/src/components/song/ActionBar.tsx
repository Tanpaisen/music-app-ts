"use client";

import { useEffect, useState } from "react";
import { SongDetail } from "@/types/song";
import { formatCompactNumber } from "@/lib/utils/format";
import { useRouter } from "next/navigation";
import PlaylistPicker from "./PlaylistPicker";

interface Props {
  song: SongDetail;
}

export default function ActionBar({ song }: Props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(song.like ?? 0);
  const [following, setFollowing] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [comment, setComment] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const [likePending, setLikePending] = useState(false);
  const [likeLoading, setLikeLoading] = useState(true);
  const [likeError, setLikeError] = useState("");

  // Favorite độc lập với Like: mỗi tài khoản lưu bài hát theo User ID.
  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(true);
  const [favoritePending, setFavoritePending] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLiked(false);
    setLikeCount(song.like ?? 0);
    setLikeLoading(true);
    setLikeError("");

    const loadLikeState = async () => {
      try {
        const response = await fetch(
          `/api/songs/like-state/${song._id}`,
          {
            credentials: "same-origin",
            cache: "no-store",
          }
        );

        // Khách chưa đăng nhập vẫn được xem bài hát
        if (response.status === 401) return;

        if (!response.ok) {
          throw new Error("Không thể tải trạng thái Like");
        }

        const result = await response.json();

        if (!cancelled) {
          setLiked(Boolean(result.liked));
          setLikeCount(result.like ?? 0);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[Like State]", error);
          setLikeError("Không thể kiểm tra trạng thái Like");
        }
      } finally {
        if (!cancelled) {
          setLikeLoading(false);
        }
      }
    };

    void loadLikeState();

    return () => {
      cancelled = true;
    };
  }, [song._id, song.like]);

  
  const handleLike = async () => {
    if (likePending || likeLoading) return;

    setLikePending(true);
    setLikeError("");

    try {
      const status = liked ? "unlike" : "like";

      const response = await fetch(
        `/api/songs/like/${status}/${song._id}`,
        {
          method: "PATCH",
          credentials: "same-origin",
        }
      );

      if (response.status === 401) {
        const currentPath = window.location.pathname;

        router.push(
          `/auth/login?next=${encodeURIComponent(currentPath)}`
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Không thể cập nhật lượt thích");
      }

      const result = await response.json();

      setLiked(Boolean(result.liked));
      setLikeCount(result.like ?? 0);

    } catch (error) {
      console.error("[Like]", error);
      setLikeError("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setLikePending(false);
    }
  };

  // Lấy trạng thái lưu của tài khoản hiện tại khi mở/chuyển bài hát.
  useEffect(() => {
    let cancelled = false;
    setFavorite(false);
    setFavoriteLoading(true);
    setFavoriteError("");

    async function loadFavoriteState() {
      try {
        const response = await fetch(
          `/api/songs/favorite/status/${song._id}`,
          { credentials: "same-origin", cache: "no-store" }
        );
        // Người chưa đăng nhập vẫn xem và nghe nhạc bình thường.
        if (response.status === 401) return;
        if (!response.ok) throw new Error("Không thể đọc trạng thái lưu");

        const data: { favorite?: boolean } = await response.json();
        if (!cancelled) setFavorite(Boolean(data.favorite));
      } catch (error) {
        console.error("[Favorite State]", error);
        if (!cancelled) setFavoriteError("Không thể kiểm tra bài hát đã lưu");
      } finally {
        if (!cancelled) setFavoriteLoading(false);
      }
    }

    void loadFavoriteState();
    return () => { cancelled = true; };
  }, [song._id]);

  const handleFavorite = async () => {
    if (favoritePending || favoriteLoading) return;
    setFavoritePending(true);
    setFavoriteError("");

    try {
      const status = favorite ? "unfavorite" : "favorite";
      const response = await fetch(
        `/api/songs/favorite/${status}/${song._id}`,
        { method: "PATCH", credentials: "same-origin" }
      );

      if (response.status === 401) {
        const next = window.location.pathname + window.location.search;
        router.push(`/auth/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!response.ok) throw new Error(`Favorite lỗi: ${response.status}`);

      // Controller trả { code, message }, không trả trạng thái favorite.
      setFavorite(status === "favorite");
    } catch (error) {
      console.error("[Favorite]", error);
      setFavoriteError("Không thể cập nhật bài hát đã lưu. Vui lòng thử lại.");
    } finally {
      setFavoritePending(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const BTN = "flex flex-col items-center gap-[5px] rounded-xl px-[10px] py-[6px] text-[#555] transition-colors hover:bg-white/5 hover:text-[#aaa]";

  return (
    <div>
      {/* Hàng nút chính */}
      <div className="grid grid-cols-3 gap-2 border-b border-t border-[#1a1a1a] py-3 sm:grid-cols-6">
        {/* Like */}
        <button
          className={BTN}
          onClick={handleLike}
          disabled={likeLoading || likePending}
          aria-pressed={liked}
          style={{ color: liked ? "#f43f5e" : undefined, opacity: likeLoading || likePending ? 0.6 : 1 }}
          aria-label={liked ? "Bỏ thích bài hát" : "Thích bài hát"}
        >
          <i className={`bi ${liked ? "bi-heart-fill" : "bi-heart"} text-[21px]`} />
          <span className="font-mono text-[11px] text-[#444]">{formatCompactNumber(likeCount)}</span>
        </button>

        {/* Lưu vào thư viện riêng – độc lập với nút Like */}
        <button
          type="button"
          className={BTN}
          onClick={handleFavorite}
          disabled={favoriteLoading || favoritePending}
          aria-pressed={favorite}
          aria-label={favorite ? "Bỏ lưu bài hát" : "Lưu bài hát"}
          style={{
            color: favorite ? "#a78bfa" : undefined,
            opacity: favoriteLoading || favoritePending ? 0.6 : 1,
          }}
        >
          <i className={`bi ${favorite ? "bi-bookmark-fill" : "bi-bookmark"} text-[21px]`} />
          <span className="font-mono text-[11px] text-[#444]">
            {favorite ? "Đã lưu" : "Lưu"}
          </span>
        </button>

        {/* Comment */}
        <button
          className={BTN}
          onClick={() => { setShowComment(!showComment); setShowPlaylist(false); }}
          style={{ color: showComment ? "#60a5fa" : undefined }}
          aria-label="Bình luận"
        >
          <i className="bi bi-chat-heart text-[21px]" />
          <span className="font-mono text-[11px] text-[#444]">248</span>
        </button>

        {/* Theo dõi */}
        <button
          className={BTN}
          onClick={() => setFollowing(!following)}
          style={{ color: following ? "#4ade80" : undefined }}
          aria-label="Theo dõi nghệ sĩ"
        >
          <i className={`bi ${following ? "bi-person-check-fill" : "bi-person-plus"} text-[21px]`} />
          <span className="font-mono text-[11px] text-[#444]">{following ? "Đang theo" : "Theo dõi"}</span>
        </button>

        {/* Thêm vào playlist */}
        <button
          className={BTN}
          onClick={() => { setShowPlaylist(!showPlaylist); setShowComment(false); }}
          style={{ color: showPlaylist ? "#a78bfa" : undefined }}
          aria-label="Thêm vào playlist"
        >
          <i className="bi bi-collection-play text-[21px]" />
          <span className="font-mono text-[11px] text-[#444]">Playlist</span>
        </button>

        {/* Chia sẻ */}
        <button
          className={BTN}
          onClick={handleShare}
          style={{ color: copied ? "#fb923c" : undefined }}
          aria-label="Chia sẻ"
        >
          <i className="bi bi-share text-[21px]" />
          <span className="font-mono text-[11px] text-[#444]">{copied ? "Đã copy!" : "Chia sẻ"}</span>
        </button>
      </div>

      {likeError && <p role="alert" className="mt-2 text-xs text-red-400">{likeError}</p>}
      {favoriteError && <p role="alert" className="mt-2 text-xs text-red-400">{favoriteError}</p>}

      {/* Playlist riêng của tài khoản - lấy trực tiếp từ MongoDB qua API */}
      {showPlaylist && <PlaylistPicker songId={song._id} />}

      {/* Box comment */}
      {showComment && (
        <div className="mt-2 rounded-xl border border-[#222] bg-[#141414] p-3">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-[#444]">Bình luận (248)</p>
          <div className="mb-3 flex flex-col gap-2.5">
            {[
              { name: "@user_123", text: "Bài này hay quá 🔥", bg: "#2a1a3a" },
              { name: "@music_lover", text: "Nghe mãi không chán 💚", bg: "#1a2a1a" },
            ].map((c, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] text-[#888]"
                  style={{ background: c.bg }}>
                  {c.name[1].toUpperCase()}
                </div>
                <div className="rounded-xl bg-[#1e1e1e] px-3 py-2">
                  <p className="text-[12px] font-medium text-[#bbb]">{c.name}</p>
                  <p className="text-[12px] text-[#666]">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Thêm bình luận..."
              className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] px-3 py-2 text-[12px] text-[#bbb] outline-none focus:border-[#4ade80]"
            />
            <button
              onClick={() => setComment("")}
              className="rounded-lg bg-[#4ade80] px-3 py-2 text-[13px] font-medium text-[#050f0a]"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
