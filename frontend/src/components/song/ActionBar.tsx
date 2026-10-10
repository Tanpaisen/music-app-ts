"use client";

import { useState } from "react";
import { SongDetail } from "@/types/song";
import { formatCompactNumber } from "@/lib/utils/format";

interface Props {
  song: SongDetail;
}

// Playlist giả — trong thực tế fetch từ API /api/playlists của user
const MOCK_PLAYLISTS = ["Nhạc yêu thích", "Nhạc chill cuối tuần", "Nhạc tập gym"];

export default function ActionBar({ song }: Props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(song.like);
  const [following, setFollowing] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [addedPlaylists, setAddedPlaylists] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [copied, setCopied] = useState(false);

  const handleLike = async () => {
    const status = liked ? "unlike" : "like";
    setLiked(!liked);
    setLikeCount((p) => (liked ? p - 1 : p + 1));
    await fetch(`/api/songs/like/${song._id}/${status}`, { method: "PATCH" });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleAddPlaylist = (name: string) => {
    setAddedPlaylists((p) => (p.includes(name) ? p : [...p, name]));
  };

  const BTN = "flex flex-col items-center gap-[5px] rounded-xl px-[10px] py-[6px] text-[#555] transition-colors hover:bg-white/5 hover:text-[#aaa]";

  return (
    <div>
      {/* Hàng nút chính */}
      <div className="flex justify-between border-b border-t border-[#1a1a1a] py-3">
        {/* Like */}
        <button
          className={BTN}
          onClick={handleLike}
          style={{ color: liked ? "#f43f5e" : undefined }}
          aria-label="Yêu thích"
        >
          <i className={`bi ${liked ? "bi-heart-fill" : "bi-heart"} text-[21px]`} />
          <span className="font-mono text-[11px] text-[#444]">{formatCompactNumber(likeCount)}</span>
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

      {/* Dropdown playlist */}
      {showPlaylist && (
        <div className="mt-2 rounded-xl border border-[#2a2a2a] bg-[#181818] p-3">
          <p className="mb-2 px-2 text-[10px] uppercase tracking-widest text-[#444]">
            Thêm vào playlist
          </p>
          <div className="flex flex-col gap-0.5">
            {MOCK_PLAYLISTS.map((name) => (
              <button
                key={name}
                onClick={() => handleAddPlaylist(name)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#222]"
                style={{ color: addedPlaylists.includes(name) ? "#4ade80" : "#bbb" }}
              >
                <i className={`bi ${addedPlaylists.includes(name) ? "bi-check-circle-fill" : "bi-music-note"} text-[#555]`} />
                {addedPlaylists.includes(name) ? `✓ ${name}` : name}
              </button>
            ))}
            <div className="my-1.5 h-px bg-[#222]" />
            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[#a78bfa] transition-colors hover:bg-[#222]">
              <i className="bi bi-plus-circle" />
              Tạo playlist mới
            </button>
          </div>
        </div>
      )}

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
