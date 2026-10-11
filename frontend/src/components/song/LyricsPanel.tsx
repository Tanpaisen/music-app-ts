"use client";

import { useEffect, useMemo, useRef } from "react";
import { parseLrc, getActiveIndex } from "@/lib/utils/parseLrc";
import WaveformCanvas from "./WaveformCanvas";

interface Props {
  lyrics: string | null;
  title: string;
  isPlaying: boolean;
  currentTime: number;
}

export default function LyricsPanel({ lyrics, title, isPlaying, currentTime }: Props) {
  const lines = useMemo(() => parseLrc(lyrics ?? ""), [lyrics]);
  const activeIdx = getActiveIndex(lines, currentTime);
  const activeRef = useRef<HTMLParagraphElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Chỉ cuộn trong khung Lyrics; scrollIntoView() có thể kéo cả trang lên/xuống.
  useEffect(() => {
    const viewport = scrollRef.current;
    const line = activeRef.current;
    if (!viewport || !line || activeIdx < 0) return;

    const targetTop = line.offsetTop - (viewport.clientHeight - line.clientHeight) / 2;
    viewport.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  }, [activeIdx]);

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.015] sm:min-h-[200px] md:min-h-[260px]">
        <p className="text-sm text-[#666]">Chưa có lời bài hát</p>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 min-h-[180px] overflow-hidden rounded-xl md:min-h-[260px]">
      <WaveformCanvas activeIdx={activeIdx} isPlaying={isPlaying} />
      <p className="relative z-10 mb-3 truncate text-[10px] uppercase tracking-[1.5px] text-[#666] sm:mb-4">
        Lời bài hát · {title}
      </p>
      <div
        ref={scrollRef}
        className="relative z-10 max-h-[240px] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:max-h-[320px] md:max-h-[400px] xl:max-h-[460px]"
      >
        <div className="flex flex-col gap-3 pb-16 pt-3 sm:gap-4 sm:pb-20 sm:pt-4">
          {lines.map((line, i) => {
            const isActive = i === activeIdx;
            return (
              <p
                key={i}
                ref={isActive ? activeRef : null}
                className={`cursor-default leading-snug transition-all duration-300 ${
                  isActive
                    ? "text-[20px] font-semibold sm:text-[23px] md:text-[25px]"
                    : "text-[16px] font-medium sm:text-[18px] md:text-[20px]"
                }`}
                style={{
                  color: isActive ? "#ffffff" : "#888888",
                  opacity: isActive ? 1 : Math.abs(i - activeIdx) <= 2 ? 0.5 : 0.25,
                }}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-7 z-20 h-9 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </div>
  );
}
