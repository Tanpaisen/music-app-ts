"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "#6b21a8","#1d4ed8","#065f46","#7c2d12",
  "#1e3a5f","#4a1942","#0f3460","#1a3a1a",
];

interface Props {
  activeIdx: number;
  isPlaying: boolean;
}

export default function WaveformCanvas({ activeIdx, isPlaying }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef(0);
  const barsRef = useRef<{ base: number; freq: number; phase: number; x: number }[]>([]);

  useEffect(() => {
    barsRef.current = Array.from({ length: 60 }, (_, i) => ({
      base: 0.15 + Math.random() * 0.4,
      freq: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      x: i / 60,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const col = COLORS[activeIdx % COLORS.length];
      const bw = Math.max(2, W / 60 - 1.5);
      barsRef.current.forEach((b) => {
        const amp = b.base + 0.35 * Math.sin(phaseRef.current * b.freq + b.phase);
        const h = Math.max(4, amp * H * 0.9);
        const x = b.x * W, y = (H - h) / 2;
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.1 + amp * 0.22;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, h, 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    if (!isPlaying) { draw(); return; }

    const loop = () => {
      phaseRef.current += 0.04;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, activeIdx]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full rounded-xl opacity-50"
      aria-hidden="true"
    />
  );
}
