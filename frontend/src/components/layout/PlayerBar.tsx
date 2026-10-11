"use client";

import Image from "next/image";
import Link from "next/link";
import { usePlayer } from "@/components/player/PlayerProvider";

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

export default function PlayerBar() {
  const p = usePlayer();
  if (!p.track) return null;

  const control = "rounded-lg p-2 text-muted transition-colors hover:bg-white/10 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30";
  const hasNext = p.queue.length > 1;
  return (
    <aside aria-label="Trình phát nhạc thu nhỏ" className="fixed inset-x-0 bottom-0 z-[50] border-t border-line bg-panel/95 px-3 py-2 backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Link href={`/songs/detail/${encodeURIComponent(p.track.slug)}`}
            className="flex min-w-0 max-w-[54%] items-center gap-2 hover:opacity-80 sm:flex-1 sm:max-w-[34%]"
            aria-label={`Mở chi tiết ${p.track.title}`}>
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-raised sm:h-12 sm:w-12">
              {p.track.avatar ? <Image src={p.track.avatar} alt={p.track.title} fill sizes="48px" className="object-cover" /> : <i className="bi bi-music-note-beamed" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-ink sm:text-sm">{p.track.title}</span>
              <span className="block truncate text-[11px] text-muted">{p.track.singer?.fullName ?? "Đang cập nhật"}</span>
            </span>
          </Link>

          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
            <button type="button" className={control} onClick={p.toggleShuffle} aria-label="Phát ngẫu nhiên" aria-pressed={p.shuffle}
              style={{ color: p.shuffle ? "#f2a65a" : undefined }}><i className="bi bi-shuffle" /></button>
            <button type="button" className={control} onClick={p.previousSong} aria-label="Bài trước"><i className="bi bi-skip-start-fill text-lg" /></button>
            <button type="button" onClick={p.togglePlay} aria-label={p.isPlaying ? "Tạm dừng" : "Tiếp tục phát"}
              className="mx-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-lg active:scale-95"
              style={{ color: "#171717" }}>
              <i className={`bi ${p.isPlaying ? "bi-pause-fill" : "bi-play-fill"}`} />
            </button>
            <button type="button" className={control} onClick={p.nextSong} disabled={!hasNext && p.repeat !== "all"}
              aria-label="Bài tiếp theo"><i className="bi bi-skip-end-fill text-lg" /></button>
            <button type="button" className={control} onClick={p.cycleRepeat}
              aria-label={`Chế độ lặp: ${p.repeat}`} title={p.repeat === "off" ? "Không lặp" : p.repeat === "all" ? "Lặp danh sách" : "Lặp một bài"}
              style={{ color: p.repeat === "off" ? undefined : "#f2a65a" }}>
              <i className={`bi ${p.repeat === "one" ? "bi-repeat-1" : "bi-repeat"}`} />
            </button>
          </div>

          <div className="hidden min-w-[115px] items-center justify-end gap-2 text-muted lg:flex">
            <i className="bi bi-volume-up" aria-hidden="true" />
            <input aria-label="Âm lượng" type="range" min="0" max="1" step="0.05" value={p.volume}
              onChange={e => p.changeVolume(Number(e.target.value))} className="w-24 accent-[#f2a65a]" />
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-muted sm:text-[11px]">
          <span className="w-9 text-right">{formatTime(p.currentTime)}</span>
          <input aria-label="Tiến độ phát nhạc" type="range" min="0" max={p.duration > 0 ? p.duration : 1} step="0.25"
            value={Math.min(p.currentTime, p.duration > 0 ? p.duration : 1)} onChange={e => p.seekTo(Number(e.target.value))}
            disabled={p.duration <= 0} className="min-w-0 flex-1 accent-[#f2a65a] disabled:opacity-40" />
          <span className="w-9">{p.duration > 0 ? formatTime(p.duration) : "--:--"}</span>
        </div>
      </div>
    </aside>
  );
}
