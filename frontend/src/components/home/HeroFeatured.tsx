import Image from "next/image";
import Link from "next/link";
import { Song } from "@/types/home";
import PlayingBars from "@/components/ui/PlayingBars";
import { formatCompactNumber } from "@/lib/utils/format";

export default function HeroFeatured({ songs }: { songs: Song[] }) {
  if (songs.length === 0) return null;

  const [hero, ...rest] = songs;
  const sidePicks = rest.slice(0, 2);

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl text-ink">Đang được nghe nhiều nhất</h2>
        <Link href="/songs" className="text-xs uppercase tracking-wide text-muted hover:text-amber">
          Xem tất cả
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Hero chính */}
        <Link
          href={`/songs/detail/${hero.slug}`}
          className="group relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-2xl border border-line bg-panel p-8"
        >
          <Image
            src={hero.avatar}
            alt={hero.title}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-base via-base/70 to-transparent" />

          <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-amber">
            <PlayingBars />
            Đang phát nhiều nhất hôm nay
          </div>
          <h3 className="relative z-10 mt-3 font-display text-4xl leading-tight text-ink">
            {hero.title}
          </h3>
          <p className="relative z-10 mt-2 text-sm text-muted">{hero.singer?.fullName ?? "Đang cập nhật"}</p>

          <div className="relative z-10 mt-6 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber text-base shadow-glow transition-transform group-hover:scale-105">
              <i className="bi bi-play-fill text-2xl" />
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted">
              <i className="bi bi-heart" /> {formatCompactNumber(hero.like)}
            </span>
          </div>
        </Link>

        {/* 2 gợi ý nghe tiếp */}
        <div className="grid grid-rows-2 gap-4">
          {sidePicks.map((song) => (
            <Link
              key={song.slug}
              href={`/songs/detail/${song.slug}`}
              className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-line bg-panel px-6 py-5"
            >
              <div className="relative z-10 max-w-[70%]">
                <p className="truncate font-display text-lg text-ink">{song.title}</p>
                <p className="mt-1 truncate text-sm text-muted">{song.singer?.fullName ?? "Đang cập nhật"}</p>
              </div>
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors group-hover:border-amber group-hover:text-amber">
                <i className="bi bi-play-fill" />
              </span>
              <Image
                src={song.avatar}
                alt=""
                fill
                sizes="30vw"
                className="object-cover opacity-15 transition-opacity group-hover:opacity-25"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
