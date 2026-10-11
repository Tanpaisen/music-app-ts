"use client";

import { useEffect, useState } from "react";
import { SongDetail } from "@/types/song";
import { formatCompactNumber } from "@/lib/utils/format";
import { useRouter } from "next/navigation";
import PlaylistPicker from "./PlaylistPicker";
import CommentPanel from "./CommentPanel";

interface Props {
  song: SongDetail;
}

export default function ActionBar({ song }: Props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(song.like ?? 0);
  const [showComment, setShowComment] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
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

  // Theo dõi nghệ sĩ: lưu theo User ID, tách khỏi Like và Favorite.
  const singerId = song.singer?._id;
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(true);
  const [followPending, setFollowPending] = useState(false);
  const [followError, setFollowError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setFollowing(false);
    setFollowError("");
    setFollowLoading(Boolean(singerId));
    if (!singerId) return () => controller.abort();

    const loadFollow = async () => {
      try {
        const response = await fetch(`/api/follows/singers/${singerId}/status`, {
          credentials: "same-origin", cache: "no-store", signal: controller.signal,
        });
        // Người chưa đăng nhập vẫn nghe nhạc và xem trang bình thường.
        if (response.status === 401) return;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result: { following?: boolean } = await response.json();
        if (!controller.signal.aborted) setFollowing(Boolean(result.following));
      } catch (cause) {
        if (!controller.signal.aborted) {
          console.error("[Follow/status]", cause);
          setFollowError("Không thể lấy trạng thái theo dõi");
        }
      } finally {
        if (!controller.signal.aborted) setFollowLoading(false);
      }
    };
    void loadFollow();
    return () => controller.abort();
  }, [singerId]);

  const handleFollow = async () => {
    if (!singerId || followLoading || followPending) return;
    setFollowPending(true);
    setFollowError("");
    try {
      const response = await fetch(`/api/follows/singers/${singerId}`, {
        method: following ? "DELETE" : "PUT",
        credentials: "same-origin",
      });
      if (response.status === 401) {
        const next = window.location.pathname + window.location.search;
        router.push(`/auth/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: { following?: boolean } = await response.json();
      setFollowing(Boolean(result.following));
    } catch (cause) {
      console.error("[Follow]", cause);
      setFollowError("Không thể thay đổi theo dõi. Vui lòng thử lại.");
    } finally {
      setFollowPending(false);
    }
  };

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

  // Tổng bình luận công khai, không cần đăng nhập để xem.
  useEffect(() => {
    const controller = new AbortController();
    setCommentCount(0);
    const loadCount = async () => {
      try {
        const response = await fetch(`/api/comments/song/${song._id}/count`, {
          credentials: "same-origin", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result: { count?: number } = await response.json();
        if (!controller.signal.aborted) setCommentCount(result.count ?? 0);
      } catch (cause) {
        if (!controller.signal.aborted) console.error("[Comment/count]", cause);
      }
    };
    void loadCount();
    return () => controller.abort();
  }, [song._id]);

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
          <span className="font-mono text-[11px] text-[#444]">{formatCompactNumber(commentCount)}</span>
        </button>

        {/* Theo dõi nghệ sĩ thực: không còn dùng state giả */}
        <button
          type="button"
          className={BTN}
          onClick={handleFollow}
          disabled={!singerId || followLoading || followPending}
          aria-pressed={following}
          style={{
            color: following ? "#4ade80" : undefined,
            opacity: !singerId || followLoading || followPending ? 0.5 : 1,
          }}
          aria-label={following ? `Bỏ theo dõi ${song.singer?.fullName || "nghệ sĩ"}` : `Theo dõi ${song.singer?.fullName || "nghệ sĩ"}`}
        >
          <i className={`bi ${following ? "bi-person-check-fill" : "bi-person-plus"} text-[21px]`} />
          <span className="font-mono text-[11px] text-[#444]">
            {!singerId ? "Chưa có ca sĩ" : following ? "Đang theo" : "Theo dõi"}
          </span>
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
      {followError && <p role="alert" className="mt-2 text-xs text-red-400">{followError}</p>}

      {/* Playlist riêng của tài khoản - lấy trực tiếp từ MongoDB qua API */}
      {showPlaylist && <PlaylistPicker songId={song._id} />}

      {/* Bình luận thật, công khai để xem, xác thực khi thêm/sửa/xóa */}
      {showComment && <CommentPanel key={song._id} songId={song._id} onCountChange={setCommentCount} />}
    </div>
  );
}
