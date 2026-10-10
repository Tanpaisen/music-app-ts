"use client";

import { useEffect, useMemo, useRef } from "react";
import { parseLrc, getActiveIndex } from "@/lib/utils/parseLrc";
import WaveformCanvas from "./WaveformCanvas";

interface Props {
  lyrics: string | null;
  title: string;
  isPlaying: boolean;
  currentTime: number; // nhận từ AudioControls qua state ở SongDetailClient
}

export default function LyricsPanel({ lyrics, title, isPlaying, currentTime }: Props) {
  const lines = useMemo(() => parseLrc(lyrics ?? ""), [lyrics]);
  const activeIdx = getActiveIndex(lines, currentTime);
  const activeRef = useRef<HTMLParagraphElement>(null);

  // Auto scroll dòng đang phát vào giữa màn hình
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-[#555]">Chưa có lời bài hát</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[300px]">
      {/* Waveform background */}
      <WaveformCanvas activeIdx={activeIdx} isPlaying={isPlaying} />

      {/* Label */}
      <p className="relative z-10 mb-4 text-[10px] uppercase tracking-[1.5px] text-[#444]">
        Lời bài hát · {title}
      </p>

      {/* Lyrics scroll container */}
      <div className="relative z-10 max-h-[480px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-4 pb-20 pt-4">
          {lines.map((line, i) => {
            const isActive = i === activeIdx;
            return (
              <p
                key={i}
                ref={isActive ? activeRef : null}
                className="cursor-default leading-snug transition-all duration-300"
                style={{
                  fontSize: isActive ? "27px" : "22px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#ffffff" : "#888888",
                  opacity: isActive ? 1 : Math.abs(i - activeIdx) <= 2 ? 0.4 : 0.2,
                }}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      </div>

      {/* Fade top/bottom để lyrics mờ dần */}
      <div className="pointer-events-none absolute inset-x-0 top-10 z-20 h-12 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </div>
  );
}
