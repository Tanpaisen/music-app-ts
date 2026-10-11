import Link from "next/link";

export type CatalogSong = {
  _id: string;
  title?: string;
  slug?: string;
  avatar?: string;
  listen?: number;
  like?: number;
  singer?: { fullName?: string; slug?: string } | null;
};

export default function CatalogSongList({ songs }: { songs: CatalogSong[] }) {
  return <div className="flex flex-col gap-2">
    {songs.map((song, index) => (
      <Link key={song._id} href={`/songs/detail/${encodeURIComponent(song.slug || "")}`}
        className="flex items-center gap-4 rounded-xl border border-[#292929] bg-[#161616] p-3 hover:border-[#444] hover:bg-[#202020]">
        <span className="w-6 shrink-0 text-center text-xs text-[#666]">{index + 1}</span>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#292929]">
          {song.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={song.avatar} alt={`Ảnh bìa ${song.title ?? "bài hát"}`} className="h-full w-full object-cover" />
          ) : <i className="bi bi-music-note text-[#777]" aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#eee]">{song.title ?? "Bài hát"}</p>
          <p className="truncate text-xs text-[#888]">{song.singer?.fullName ?? "Chưa rõ ca sĩ"}</p>
        </div>
        <span className="hidden text-xs text-[#777] sm:inline">{(song.listen ?? 0).toLocaleString("vi-VN")} lượt nghe</span>
        <i className="bi bi-play-circle text-xl text-[#f2a65a]" aria-hidden="true" />
      </Link>
    ))}
  </div>;
}
