import Image from "next/image";
import Link from "next/link";
import { Song } from "@/types/home";
import PlayingBars from "@/components/ui/PlayingBars";
import { formatCompactNumber } from "@/lib/utils/format";

export default function TrackTable({ songs }: { songs: Song[] }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl text-ink">BXH bài hát</h2>
        <Link href="/songs" className="text-xs uppercase tracking-wide text-muted hover:text-amber">
          Xem tất cả
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="w-14 py-3 pl-5 font-normal">#</th>
              <th className="py-3 font-normal">Bài hát</th>
              <th className="hidden py-3 font-normal sm:table-cell">Nghệ sĩ</th>
              <th className="hidden py-3 pr-5 text-right font-normal md:table-cell">Lượt thích</th>
              <th className="py-3 pr-5 text-right font-normal">
                <i className="bi bi-headphones" />
              </th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {songs.map((song, i) => (
              <tr
                key={song.slug}
                className={`group border-b border-line/60 last:border-0 hover:bg-panel ${
                  i === 0 ? "bg-panel" : ""
                }`}
              >
                <td className="py-3 pl-5 align-middle text-muted">
                  {i === 0 ? <PlayingBars /> : String(i + 1).padStart(2, "0")}
                </td>
                <td className="py-3 align-middle">
                  <Link href={`/songs/detail/${song.slug}`} className="flex items-center gap-3">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-raised">
                      <Image src={song.avatar} alt={song.title} fill sizes="44px" className="object-cover" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-body text-[0.95rem] text-ink group-hover:text-amber">
                        {song.title}
                      </span>
                      <span className="block truncate font-body text-xs text-muted sm:hidden">
                        {song.singer?.fullName ?? "Đang cập nhật"}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="hidden py-3 align-middle text-muted sm:table-cell">
                  {song.singer?.fullName ?? "Đang cập nhật"}
                </td>
                <td className="hidden py-3 pr-5 text-right align-middle text-muted md:table-cell">
                  <i className="bi bi-heart mr-1.5" />
                  {song.like ?? 0}
                </td>
                <td className="py-3 pr-5 text-right align-middle text-muted">
                  {formatCompactNumber(song.listen)}
                </td>
              </tr>
            ))}

            {songs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center font-body text-muted">
                  Chưa có bài hát nào để hiển thị.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
