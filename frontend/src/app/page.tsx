import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import HeroFeatured from "@/components/home/HeroFeatured";
import TopicCarousel from "@/components/home/TopicCarousel";
import TrackTable from "@/components/home/TrackTable";
import PlayerBar from "@/components/layout/PlayerBar";
import WaveDivider from "@/components/ui/WaveDivider";
import { getHomeData } from "@/lib/api/home";

export default async function HomePage() {
  // Một lần gọi duy nhất tới GET /home, trả về cả 3 phần dữ liệu cần thiết
  const { featured, topTracks, newReleases } = await getHomeData();

  const nowPlaying = topTracks[0];

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />

        <main className="flex-1 space-y-10 px-4 pb-10 lg:px-10">
          <HeroFeatured songs={topTracks} />
          <WaveDivider />
          <TopicCarousel topics={featured} />
          <WaveDivider />
          <TrackTable songs={topTracks} />

          {newReleases.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-2xl text-ink">Mới phát hành</h2>
              <TrackTable songs={newReleases} />
            </section>
          )}
        </main>

        <WaveDivider />

        <PlayerBar song={nowPlaying} />
      </div>
    </div>
  );
}
