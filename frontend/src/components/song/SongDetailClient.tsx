"use client";

import { useState } from "react";
import { usePlayer } from "@/components/player/PlayerProvider";
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
  const player = usePlayer();
  const [showRelated, setShowRelated] = useState(false);

  const isCurrentSong = player.track?.slug === song.slug;
  const isPlaying = isCurrentSong && player.isPlaying;
  const currentTime = isCurrentSong ? player.currentTime : 0;
  const duration = isCurrentSong ? player.duration : 0;

  const handleTogglePlay = () => {
    if (isCurrentSong) player.togglePlay();
    else player.playSong(song);
  };

  return (
    <div className="min-h-screen min-w-0 bg-[#0a0a0a] px-4 py-4 sm:px-6 sm:py-5">
      {/* Header gọn khi màn hình nhỏ */}
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <Link href="/" className="text-[18px] text-[#444] transition-colors hover:text-[#888]" aria-label="Quay lại">
          <i className="bi bi-chevron-down" />
        </Link>
        <span className="hidden items-center gap-1.5 text-[10px] uppercase tracking-[2px] text-[#444] sm:flex">
          <i className="bi bi-reception-4" />
          NOW PLAYING FROM PLAYLIST
        </span>
        <button className="text-[18px] text-[#444]" aria-label="Tuỳ chọn">
          <i className="bi bi-three-dots" />
        </button>
      </div>

      {/*
        Mobile: đĩa + thông tin -> nút phát -> lời bài hát.
        Tablet/Desktop: đĩa ở trái, lyrics ở phải, nút phát ở hàng dưới.
        Không nhân đôi PlayerProvider/audio.
      */}
      <div className="flex min-w-0 flex-col gap-5 md:grid md:grid-cols-[minmax(0,230px)_minmax(0,1fr)] md:items-start md:gap-x-6 md:gap-y-5 lg:grid-cols-[minmax(0,270px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <section className="order-1 min-w-0 md:col-start-1 md:row-start-1 md:order-none">
          <VinylPlayer avatar={song.avatar} title={song.title} isPlaying={isPlaying} />

          <div className="mb-3 mt-3 sm:mb-4 sm:mt-4">
            <h1 className="break-words text-[18px] font-semibold text-[#e0e0e0] sm:text-[19px]">
              {song.title}
            </h1>
            <p className="mt-1 text-[12px] text-[#777]">
              {song.singer ? (
                <Link
                  href={`/artists/${encodeURIComponent(song.singer.slug || song.singer._id)}`}
                  className="hover:text-[#4ade80] hover:underline"
                >
                  {song.singer.fullName}
                </Link>
              ) : "Đang cập nhật"}
              {song.topic && ` · ${song.topic.title}`}
            </p>
          </div>

          <ActionBar song={song} />
        </section>

        <div className="order-2 min-w-0 md:col-span-2 md:col-start-1 md:row-start-2 md:order-none">
          <AudioControls
            canPlay={Boolean(song.audio)}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={handleTogglePlay}
            onSeek={isCurrentSong ? player.seekTo : () => {}}
            related={related}
            showRelated={showRelated}
            onToggleRelated={() => setShowRelated((p) => !p)}
          />
        </div>

        <section className="order-3 min-w-0 md:col-start-2 md:row-start-1 md:order-none">
          <LyricsPanel
            lyrics={song.lyrics}
            title={song.title}
            isPlaying={isPlaying}
            currentTime={currentTime}
          />
        </section>
      </div>
    </div>
  );
}
