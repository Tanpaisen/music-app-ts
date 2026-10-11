"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { SongSummary } from "@/types/song";

interface Props {
  audioSrc: string | null;
  songSlug: string; // Slug để ghi nhận lượt nghe sau 30 giây
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
  audioSrc, songSlug, isPlaying, currentTime,
  onTogglePlay, onTimeUpdate,
  related, showRelated, onToggleRelated,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioSrc || !songSlug) return;

    // Chỉ đếm giây audio thực sự phát, KHÔNG dùng currentTime >= 30:
    // tua bài không được xem là đã nghe đủ 30 giây.
    let playedSeconds = 0;
    let counted = false;
    let previousAudioTime: number | null = null;
    let previousWallTime: number | null = null;

    const resetSample = () => {
      previousAudioTime = null;
      previousWallTime = null;
    };

    const onLoad = () => {
      durationRef.current = Number.isFinite(a.duration) ? a.duration : 0;
    };

    const onTime = () => {
      onTimeUpdate(a.currentTime);

      if (counted || a.paused || a.seeking || a.ended || a.readyState < 2) {
        resetSample();
        return;
      }

      const wallTime = performance.now();
      const mediaTime = a.currentTime;

      if (previousAudioTime !== null && previousWallTime !== null) {
        const mediaDelta = mediaTime - previousAudioTime;
        const realDelta = (wallTime - previousWallTime) / 1000;
        const playbackRate = a.playbackRate > 0 ? a.playbackRate : 1;

        // Không tính khi tua hoặc khi audio không chạy; hỗ trợ cả pause/resume.
        if (
          mediaDelta > 0 &&
          realDelta > 0 &&
          mediaDelta <= realDelta * playbackRate + 0.5
        ) {
          playedSeconds += Math.min(realDelta, mediaDelta / playbackRate);
        }
      }

      previousAudioTime = mediaTime;
      previousWallTime = wallTime;

      if (playedSeconds >= 30 && !counted) {
        counted = true; // Chỉ gửi MỘT lần trong phiên mở bài hát này.
        void fetch(`/api/songs/listen/${encodeURIComponent(songSlug)}`, {
          method: "PATCH",
          credentials: "same-origin",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Ghi nhận lượt nghe thất bại: HTTP ${response.status}`);
            }
          })
          .catch((error) => {
            // Không tự gửi lại: nếu server đã tăng nhưng response bị mất,
            // retry có thể làm tăng trùng lượt nghe.
            console.error("[listen/30s]", error);
          });
      }
    };

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoad);
    // Đặt lại điểm mốc, KHÔNG xóa tổng giây đã nghe khi Pause/tua.
    for (const event of ["play", "pause", "seeking", "seeked", "waiting", "ended", "ratechange"]) {
      a.addEventListener(event, resetSample);
    }
    if (a.readyState >= 1) onLoad();

    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoad);
      for (const event of ["play", "pause", "seeking", "seeked", "waiting", "ended", "ratechange"]) {
        a.removeEventListener(event, resetSample);
      }
    };
  }, [audioSrc, songSlug, onTimeUpdate]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      void a.play().catch((error) => console.error("[audio/play]", error));
    } else {
      a.pause();
    }
  }, [isPlaying, audioSrc]);

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
