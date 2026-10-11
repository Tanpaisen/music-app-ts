"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SongDetail, SongSummary } from "@/types/song";
import VinylPlayer from "./VinylPlayer";
import LyricsPanel from "./LyricsPanel";
import ActionBar from "./ActionBar";
import AudioControls from "./AudioControls";

interface Props {
  song: SongDetail;
  related: SongSummary[];
}

export default function SongDetailClient({ song, related }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // state chia sẻ giữa audio và lyrics
  const [showRelated, setShowRelated] = useState(false);

  // useCallback tránh re-render AudioControls không cần thiết
  const handleTimeUpdate = useCallback((t: number) => setCurrentTime(t), []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-5">

      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-[18px] text-[#444] transition-colors hover:text-[#888]" aria-label="Quay lại">
          <i className="bi bi-chevron-down" />
        </Link>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[2px] text-[#444]">
          <i className="bi bi-reception-4" />
          NOW PLAYING FROM PLAYLIST
        </span>
        <button className="text-[18px] text-[#444] transition-colors hover:text-[#888]" aria-label="Tuỳ chọn">
          <i className="bi bi-three-dots" />
        </button>
      </div>

      {/* Body: 2 cột */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">

        {/* Cột trái */}
        <div>
          {/* Đĩa vinyl — nhận isPlaying để quay/dừng */}
          <VinylPlayer avatar={song.avatar} title={song.title} isPlaying={isPlaying} />

          {/* Tên bài */}
          <div className="mb-4 mt-4">
            <h1 className="text-[19px] font-medium text-[#e0e0e0]">{song.title}</h1>
            <p className="mt-1 text-[12px] text-[#4a4a4a]">
              {song.singer?.fullName ?? "Đang cập nhật"}
              {song.topic && ` · ${song.topic.title}`}
            </p>
          </div>

          {/* Like, comment, follow, playlist, share */}
          <ActionBar song={song} />
        </div>

        {/* Cột phải: Lyrics tự sync theo currentTime */}
        <LyricsPanel
          lyrics={song.lyrics}
          title={song.title}
          isPlaying={isPlaying}
          currentTime={currentTime}
        />
      </div>

      {/* Bottom: seek bar + controls + gợi ý */}
      <AudioControls
        audioSrc={song.audio}
        songSlug={song.slug}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onTimeUpdate={handleTimeUpdate}
        related={related}
        showRelated={showRelated}
        onToggleRelated={() => setShowRelated((p) => !p)}
      />
    </div>
  );
}
