"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { SongSummary } from "@/types/song";

interface Props {
  audioSrc: string | null;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  onTimeUpdate: (t: number) => void; // gửi currentTime lên SongDetailClient → LyricsPanel
  related: SongSummary[];
  showRelated: boolean;
  onToggleRelated: () => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function AudioControls({
  audioSrc, isPlaying, currentTime,
  onTogglePlay, onTimeUpdate,
  related, showRelated, onToggleRelated,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => onTimeUpdate(a.currentTime);
    const onLoad = () => { durationRef.current = a.duration; };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoad);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoad);
    };
  }, [onTimeUpdate]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    isPlaying ? a.play().catch(() => {}) : a.pause();
  }, [isPlaying]);

  const duration = durationRef.current;
  const progress = duration ? (currentTime / duration) * 100 : 0;

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    a.currentTime = p * duration;
    onTimeUpdate(p * duration);
  };

  return (
    <div className="mt-5 border-t border-[#1a1a1a] pt-4">
      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="metadata" />}

      {/* Seek bar */}
      <div
        className="relative mb-1.5 h-[3px] cursor-pointer rounded-full bg-[#1e1e1e]"
        onClick={seek}
      >
        <div
          className="relative h-full rounded-full bg-[#4ade80] transition-none"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute -right-[5px] -top-[3.5px] h-[10px] w-[10px] rounded-full bg-[#4ade80]" />
        </div>
      </div>
      <div className="mb-3 flex justify-between font-mono text-[11px] text-[#3a3a3a]">
        <span>{fmt(currentTime)}</span>
        <span>{duration ? fmt(duration) : "--:--"}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-3">
          <button className="p-1 text-[18px] text-[#383838] hover:text-[#666]" aria-label="Shuffle">
            <i className="bi bi-shuffle" />
          </button>
          <button className="p-1 text-[18px] text-[#383838] hover:text-[#666]" aria-label="Lặp lại">
            <i className="bi bi-repeat" />
          </button>
        </div>

        <div className="flex items-center gap-5">
          <button className="p-1 text-[25px] text-[#555] hover:text-[#888]" aria-label="Bài trước">
            <i className="bi bi-skip-start-fill" />
          </button>
          <button
            onClick={onTogglePlay}
            disabled={!audioSrc}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#4ade80] text-[23px] text-[#050f0a] transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
            aria-label={isPlaying ? "Dừng" : "Phát"}
          >
            <i className={`bi ${isPlaying ? "bi-pause-fill" : "bi-play-fill"}`} />
          </button>
          <button className="p-1 text-[25px] text-[#555] hover:text-[#888]" aria-label="Bài tiếp">
            <i className="bi bi-skip-end-fill" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-1 text-[18px] text-[#383838] hover:text-[#666]" aria-label="Âm lượng">
            <i className="bi bi-volume-up" />
          </button>
          <button
            onClick={onToggleRelated}
            className="p-1 text-[18px] transition-colors"
            style={{ color: showRelated ? "#4ade80" : "#383838" }}
            aria-label="Gợi ý bài tiếp theo"
          >
            <i className="bi bi-music-note-list" />
          </button>
        </div>
      </div>

      {/* Danh sách gợi ý */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: showRelated ? "400px" : "0", opacity: showRelated ? 1 : 0 }}
      >
        <div className="mt-4 border-t border-[#1a1a1a] pt-4">
          <p className="mb-2.5 text-[10px] uppercase tracking-[1.5px] text-[#3a3a3a]">Gợi ý tiếp theo</p>
          <div className="flex flex-col gap-0.5">
            {related.map((s, i) => (
              <Link
                key={s._id}
                href={`/songs/detail/${s.slug}`}
                className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-white/5"
              >
                <span className="w-4 shrink-0 text-center font-mono text-[11px] text-[#3a3a3a]">{i + 1}</span>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#181818]">
                  {s.avatar && <img src={s.avatar} alt={s.title} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-[#bbb]">{s.title}</p>
                  <p className="truncate text-[11px] text-[#444]">{s.singer?.fullName ?? "Đang cập nhật"}</p>
                </div>
                <i className="bi bi-three-dots-vertical shrink-0 text-[14px] text-[#333]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
