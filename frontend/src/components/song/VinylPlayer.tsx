"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

interface Props {
  avatar: string;
  title: string;
  isPlaying: boolean;
}

export default function VinylPlayer({ avatar, title, isPlaying }: Props) {
  const vinylRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const degRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);

  // Kim xoay vào/ra theo trạng thái play
  useEffect(() => {
    const needle = needleRef.current;
    if (!needle) return;
    needle.style.transform = isPlaying ? "rotate(0deg)" : "rotate(-22deg)";
  }, [isPlaying]);

  // Đĩa quay khi đang phát
  useEffect(() => {
    const vinyl = vinylRef.current;
    if (!vinyl) return;
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
      return;
    }
    const spin = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      degRef.current = (degRef.current + dt * 80) % 360;
      vinyl.style.transform = `rotate(${degRef.current}deg)`;
      rafRef.current = requestAnimationFrame(spin);
    };
    rafRef.current = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[230px] sm:max-w-[250px] md:max-w-[230px] lg:max-w-[270px] xl:max-w-[300px]">
      {/* Glow dưới đĩa */}
      <div
        className="pointer-events-none absolute -bottom-3 left-[10%] right-[10%] h-6"
        style={{ background: "radial-gradient(ellipse,rgba(74,222,128,0.12) 0%,transparent 70%)" }}
      />

      {/* Đĩa vinyl */}
      <div
        ref={vinylRef}
        className="relative mx-auto h-[92%] w-[92%] overflow-hidden rounded-full"
        style={{ boxShadow: "0 0 0 3px #1a1a1a,0 0 0 6px #111,0 8px 40px rgba(0,0,0,0.9)" }}
        aria-label={`Đĩa nhạc ${title}`}
      >
        {/* Ảnh bìa phủ toàn đĩa */}
        <Image src={avatar} alt={title} fill sizes="(max-width: 640px) 230px, (max-width: 1024px) 260px, 300px" className="object-cover" priority />

        {/* Overlay rãnh vinyl */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ background: "repeating-radial-gradient(circle at center,transparent 0%,transparent 4%,rgba(0,0,0,0.18) 4.5%,transparent 5%)" }}
        />

        {/* Tối viền ngoài */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle at center,transparent 40%,rgba(0,0,0,0.5) 75%,rgba(0,0,0,0.85) 100%)" }}
        />

        {/* Ánh sáng mặt đĩa */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.07) 0%,transparent 50%)" }}
        />

        {/* Lỗ giữa (spindle hole) */}
        <div
          className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0a0a0a]"
          style={{ width: "8%", height: "8%", boxShadow: "0 0 0 2px #222" }}
        />

        {/* Vòng quanh lỗ giữa */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[9] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
          style={{ width: "14%", height: "14%" }}
        />
      </div>

      {/* Kim đọc (needle) */}
      <div
        ref={needleRef}
        className="absolute right-[5%] top-[4%] z-20"
        style={{
          transformOrigin: "top center",
          transform: "rotate(0deg)",
          transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        aria-hidden="true"
      >
        <div
          className="relative h-[45px] w-[2px] rounded-sm sm:h-[55px] lg:h-[65px]"
          style={{ background: "linear-gradient(to bottom,#999,#666,#444)" }}
        >
          <div
            className="absolute -bottom-[7px] left-1/2 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-[#4ade80]"
            style={{ boxShadow: "0 0 8px #4ade80,0 0 16px rgba(74,222,128,0.4)" }}
          />
        </div>
        <div
          className="absolute -top-[7px] left-1/2 h-[14px] w-[14px] -translate-x-1/2 rounded-full border border-[#444] bg-[#2a2a2a]"
          style={{ boxShadow: "0 0 6px rgba(0,0,0,0.5)" }}
        />
      </div>
    </div>
  );
}
