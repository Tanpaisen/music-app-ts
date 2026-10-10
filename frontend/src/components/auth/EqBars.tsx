"use client";

// "use client" để tránh lỗi hydration khi render <style> inline
// Server encode &quot; nhưng client dùng " thẳng → mismatch

const BARS = [
  { duration: "0.6s", delay: "0s" },
  { duration: "0.4s", delay: "0.1s" },
  { duration: "0.8s", delay: "0.2s" },
  { duration: "0.5s", delay: "0.05s" },
  { duration: "0.7s", delay: "0.15s" },
  { duration: "0.45s", delay: "0.25s" },
  { duration: "0.9s", delay: "0.3s" },
];

export default function EqBars() {
  return (
    <div className="mb-5 flex h-5 items-end gap-[3px]">
      {BARS.map((bar, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: "100%",
            background: "linear-gradient(to top,#4ade80,#22d3ee)",
            transformOrigin: "bottom",
            animation: `eqPulse ${bar.duration} ease infinite alternate`,
            animationDelay: bar.delay,
          }}
        />
      ))}
      <style>{`
        @keyframes eqPulse {
          from { transform: scaleY(0.15); }
          to   { transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .eq-bar { animation: none !important; transform: scaleY(0.6); }
        }
      `}</style>
    </div>
  );
}
