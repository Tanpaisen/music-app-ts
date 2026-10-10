import { notFound } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { getSongDetail } from "@/lib/api/song";
import SongDetailClient from "@/components/song/SongDetailClient";

interface Props {
  params: { songSlug: string };
}

export async function generateMetadata({ params }: Props) {
  const data = await getSongDetail(params.songSlug);
  if (!data) return { title: "Không tìm thấy bài hát" };
  return {
    title: `${data.song.title} · ${data.song.singer?.fullName ?? ""}`,
    description: data.song.description ?? undefined,
  };
}

export default async function SongDetailPage({ params }: Props) {
  const data = await getSongDetail(params.songSlug);
  if (!data) notFound();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        {/* SongDetailClient nhận toàn bộ state play/pause, vinyl, lyrics, controls */}
        <SongDetailClient song={data.song} related={data.related} />
      </div>
    </div>
  );
}
