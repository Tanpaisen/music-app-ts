export default function PlayingBars({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[2px] h-3.5 ${className}`} aria-hidden="true">
      <span className="w-[3px] h-full bg-amber origin-bottom animate-wave1" />
      <span className="w-[3px] h-full bg-amber origin-bottom animate-wave2" />
      <span className="w-[3px] h-full bg-amber origin-bottom animate-wave3" />
      <span className="w-[3px] h-full bg-amber origin-bottom animate-wave4" />
    </span>
  );
}
