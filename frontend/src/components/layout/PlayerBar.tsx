"use client";

import Image from "next/image";
import { useState } from "react";
import { Song } from "@/types/home";
import PlayingBars from "@/components/ui/PlayingBars";

export default function PlayerBar({ song }: { song?: Song }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState(false);

  if (!song) return null;

  return (
    <div className="sticky bottom-0 z-20 border-t border-line bg-panel/95 backdrop-blur px-4 py-3 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Bài đang phát */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-raised">
            <Image src={song.avatar} alt={song.title} fill sizes="48px" className="object-cover" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-ink">{song.title}</p>
            <p className="truncate text-xs text-muted">{song.singer?.fullName ?? "Đang cập nhật"}</p>
          </div>
          <button
            onClick={() => setLiked((v) => !v)}
            aria-label="Yêu thích"
            className={`ml-2 shrink-0 ${liked ? "text-coral" : "text-muted hover:text-coral"}`}
          >
            <i className={`bi ${liked ? "bi-heart-fill" : "bi-heart"}`} />
          </button>
        </div>

        {/* Điều khiển */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-5 text-ink">
            <button aria-label="Ngẫu nhiên" className="text-muted hover:text-ink">
              <i className="bi bi-shuffle" />
            </button>
            <button aria-label="Bài trước" className="text-muted hover:text-ink">
              <i className="bi bi-skip-start-fill" />
            </button>
            <button
              onClick={() => setIsPlaying((v) => !v)}
              aria-label={isPlaying ? "Tạm dừng" : "Phát"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-base"
            >
              <i className={`bi ${isPlaying ? "bi-pause-fill" : "bi-play-fill"}`} />
            </button>
            <button aria-label="Bài tiếp" className="text-muted hover:text-ink">
              <i className="bi bi-skip-end-fill" />
            </button>
            <button aria-label="Lặp lại" className="text-muted hover:text-ink">
              <i className="bi bi-repeat" />
            </button>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="font-mono text-[11px] text-muted">1:24</span>
            <div className="h-1 w-64 overflow-hidden rounded-full bg-raised">
              <div className="h-full w-1/3 rounded-full bg-amber" />
            </div>
            {/* Song schema chưa có "duration" nên tạm hiển thị placeholder */}
            <span className="font-mono text-[11px] text-muted">--:--</span>
          </div>
        </div>

        {/* Bên phải */}
        <div className="hidden items-center gap-3 md:flex">
          {isPlaying && <PlayingBars />}
          <i className="bi bi-mic" />
          <i className="bi bi-volume-up text-muted" />
          <div className="h-1 w-20 overflow-hidden rounded-full bg-raised">
            <div className="h-full w-2/3 rounded-full bg-ink" />
          </div>
        </div>
      </div>
    </div>
  );
}
