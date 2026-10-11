"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { SongSummary } from "@/types/song";
import { usePlayer } from "@/components/player/PlayerProvider";

interface Props {
  canPlay: boolean;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  duration: number;
  onSeek: (t: number) => void;
  related: SongSummary[];
  showRelated: boolean;
  onToggleRelated: () => void;
}
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function AudioControls({
  canPlay, isPlaying, currentTime, onTogglePlay, duration, onSeek, related, showRelated, onToggleRelated,
}: Props) {
  const player = usePlayer();
  const router = useRouter();
  const previousVolumeRef = useRef(0.8);
  const toggleMute = () => {
    if (player.volume > 0) {
      previousVolumeRef.current = player.volume;
      player.changeVolume(0);
    } else {
      player.changeVolume(previousVolumeRef.current);
    }
  };
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canPlay || duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * duration);
  };
  const button = "rounded-lg p-2 text-[19px] text-[#555] transition-colors hover:bg-white/5 hover:text-[#aaa] disabled:opacity-30";
  const activeQueueIndex = player.queue.findIndex(
    (item) => item._id === player.track?._id
  );
  // Chỉ liệt kê các bài ở phía sau bài hiện tại, không liệt kê lại bài đang phát.
  const upcoming = player.queue
    .map((item, index) => ({ ...item, queueIndex: index }))
    .filter((item) => item.queueIndex > activeQueueIndex && item._id !== player.track?._id);
  const ready = upcoming.length > 0;

  return (
    <div className="mt-5 border-t border-[#1a1a1a] pt-4">
      <div className="relative mb-1.5 h-[4px] cursor-pointer rounded-full bg-[#1e1e1e]" onClick={seek}>
        <div className="relative h-full rounded-full bg-[#4ade80]" style={{ width: `${progress}%` }}>
          <div className="absolute -right-[5px] -top-[3px] h-[10px] w-[10px] rounded-full bg-[#4ade80]" />
        </div>
      </div>
      <div className="mb-3 flex justify-between font-mono text-[11px] text-[#777]">
        <span>{fmt(currentTime)}</span><span>{duration ? fmt(duration) : "--:--"}</span>
      </div>
      <div className="flex items-center justify-between gap-1 px-1">
        <div className="flex items-center gap-0.5">
          <button className={button} onClick={player.toggleShuffle} aria-pressed={player.shuffle} aria-label="Phát ngẫu nhiên"
            style={{ color: player.shuffle ? "#4ade80" : undefined }}><i className="bi bi-shuffle" /></button>
          <button className={button} onClick={player.cycleRepeat} aria-label={`Lặp: ${player.repeat}`} title={player.repeat}
            style={{ color: player.repeat === "off" ? undefined : "#4ade80" }}>
            <i className={`bi ${player.repeat === "one" ? "bi-repeat-1" : "bi-repeat"}`} />
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button className={button} onClick={player.previousSong} aria-label="Bài trước"><i className="bi bi-skip-start-fill" /></button>
          <button onClick={onTogglePlay} disabled={!canPlay} aria-label={isPlaying ? "Tạm dừng" : "Phát"}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#4ade80] text-[23px] text-[#050f0a] transition-transform hover:scale-105 active:scale-95 disabled:opacity-40">
            <i className={`bi ${isPlaying ? "bi-pause-fill" : "bi-play-fill"}`} />
          </button>
          <button className={button} onClick={player.nextSong} disabled={!ready && player.repeat !== "all"} aria-label="Bài tiếp theo">
            <i className="bi bi-skip-end-fill" />
          </button>
        </div>
        <button className={button} onClick={onToggleRelated} style={{ color: showRelated ? "#4ade80" : undefined }}
          aria-label="Hàng đợi và gợi ý tiếp theo" aria-expanded={showRelated}>
          <i className="bi bi-music-note-list" />
        </button>
      </div>

      {/* Volume always available on song detail, including mobile. */}
      <div className="mt-3 flex items-center justify-end gap-2 text-[#888]">
        <button type="button" onClick={toggleMute}
          aria-label={player.volume === 0 ? "Bật tiếng" : "Tắt tiếng"}
          className="rounded-lg p-2 text-[18px] transition-colors hover:bg-white/5 hover:text-[#4ade80]">
          <i className={`bi ${player.volume === 0 ? "bi-volume-mute" : player.volume < 0.5 ? "bi-volume-down" : "bi-volume-up"}`} />
        </button>
        <input aria-label="Điều chỉnh âm lượng bài hát" type="range"
          min="0" max="1" step="0.01" value={player.volume}
          onChange={e => player.changeVolume(Number(e.target.value))}
          className="w-28 cursor-pointer accent-[#4ade80] sm:w-40" />
        <span className="w-10 text-right font-mono text-[11px]">{Math.round(player.volume * 100)}%</span>
      </div>

      {showRelated && (
        <section className="mt-4 rounded-2xl border border-[#282828] bg-[#121212] p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#eeeeee]">
              {ready ? "Bài hát sẽ phát tiếp" : "Gợi ý bài hát liên quan"}
            </h2>
            <span className="rounded-full bg-[#232323] px-2.5 py-1 text-[11px] text-[#999]">
              {ready ? `${upcoming.length} bài trong hàng đợi` : `${related.length} bài gợi ý`}
            </span>
          </div>

          {player.recommendationsLoading && (
            <p className="mb-2 text-xs text-[#999]">Đang tải hàng đợi cá nhân hóa...</p>
          )}

          {ready ? (
            <div className="flex flex-col gap-1">
              {upcoming.map((song, order) => (
                <button
                  type="button"
                  key={`${song._id}-${song.queueIndex}`}
                  onClick={() => {
                    player.playAt(song.queueIndex);
                    router.push(`/songs/detail/${encodeURIComponent(song.slug)}`);
                  }}
                  className="group flex w-full min-w-0 items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#222] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ade80]"
                >
                  <span className="w-5 shrink-0 text-center text-xs text-[#777]">{order + 1}</span>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#252525] sm:h-14 sm:w-14">
                    {song.avatar ? (
                      <img src={song.avatar} alt={`Bìa ${song.title}`} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <i className="bi bi-music-note-beamed text-lg text-[#777]" aria-hidden="true" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#eeeeee] group-hover:text-[#4ade80]">{song.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#999]">{song.singer?.fullName || "Đang cập nhật nghệ sĩ"}</span>
                  </span>
                  <i className="bi bi-play-circle text-xl text-[#4ade80]" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : related.length > 0 ? (
            <>
              <p className="mb-2 text-[11px] text-[#888]">
                Đây là bài hát liên quan; chọn một bài để mở trang chi tiết.
              </p>
              <div className="flex flex-col gap-1">
                {related.map((song, index) => (
                  <Link
                    key={song._id}
                    href={`/songs/detail/${encodeURIComponent(song.slug)}`}
                    className="group flex w-full min-w-0 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#222] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ade80]"
                  >
                    <span className="w-5 shrink-0 text-center text-xs text-[#777]">{index + 1}</span>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#252525] sm:h-14 sm:w-14">
                      {song.avatar ? (
                        <img src={song.avatar} alt={`Bìa ${song.title}`} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <i className="bi bi-music-note-beamed text-lg text-[#777]" aria-hidden="true" />
                      )}
                    </div>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-semibold text-[#eeeeee] group-hover:text-[#4ade80]">{song.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#999]">{song.singer?.fullName || "Đang cập nhật nghệ sĩ"}</span>
                    </span>
                    <i className="bi bi-chevron-right text-base text-[#777] group-hover:text-[#4ade80]" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </>
          ) : !player.recommendationsLoading ? (
            <p className="py-4 text-center text-sm text-[#888]">Chưa có bài hát gợi ý phù hợp.</p>
          ) : null}
        </section>
      )}
    </div>
  );
}
