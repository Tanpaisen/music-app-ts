"use client";

import { useEffect, useRef } from "react";

// Màu gradient bộ 3 — xanh mint / cyan / tím
const PALETTE = ["#4ade80", "#22d3ee", "#a78bfa", "#f472b6"];

interface Ring {
  r: number;
  phase: number;
  speed: number;
  color: string;
  amp: number;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function SonicCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let phase = 0;

    const rings: Ring[] = Array.from({ length: 5 }, (_, i) => ({
      r: 0.05 + i * 0.07,
      phase: i * Math.PI * 0.4,
      speed: 0.008 - i * 0.001,
      color: PALETTE[i % PALETTE.length],
      amp: 8 + i * 4,
    }));

    const particles: Particle[] = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.0008,
      vy: -0.0003 - Math.random() * 0.0005,
      life: Math.random(),
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    }));

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W * 0.5, cy = H * 0.5;

      // Vòng tròn rung động
      rings.forEach((ring, ri) => {
        ctx.beginPath();
        const baseR = ring.r * Math.min(W, H);
        for (let i = 0; i <= 120; i++) {
          const angle = (i / 120) * Math.PI * 2;
          const distort =
            ring.amp * Math.sin(angle * (5 + ri) + phase * ring.speed * 50 + ring.phase) +
            ring.amp * 0.4 * Math.sin(angle * (8 + ri * 2) + phase * ring.speed * 30);
          const r = baseR + distort;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        const alpha = 0.05 + ri * 0.02;
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = alpha * 2;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = ring.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Particles lơ lửng
      particles.forEach((p) => {
        p.life += 0.004;
        if (p.life > 1) {
          p.life = 0;
          p.x = Math.random();
          p.y = Math.random() * 0.3 + 0.7;
        }
        p.x += p.vx;
        p.y += p.vy;
        const alpha = p.life < 0.2 ? p.life / 0.2 : p.life > 0.8 ? (1 - p.life) / 0.2 : 1;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Glow trung tâm
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.3);
      grad.addColorStop(0, "rgba(74,222,128,0.06)");
      grad.addColorStop(0.5, "rgba(34,211,238,0.03)");
      grad.addColorStop(1, "rgba(167,139,250,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      phase += 0.35;
      raf = requestAnimationFrame(draw);
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    resize();
    window.addEventListener("resize", resize);
    if (!prefersReducedMotion) raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
