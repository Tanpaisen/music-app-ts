import { songRepository } from "../repositories/song.repository";
import { topicRepository } from "../repositories/topic.repository";
import { singerRepository } from "../repositories/singer.repository";
import {
  DashboardData,
  SingerSummary,
  SongSummary,
  TopicSummary,
} from "../types/home.types";

// Gắn thông tin singer + topic vào danh sách bài hát thô lấy từ repository,
// và chuẩn hoá lại đúng shape SongSummary để trả ra ngoài.
async function enrichSongs(rawSongs: any[]): Promise<SongSummary[]> {
  const singerIds = [...new Set(rawSongs.map((s) => s.singerId).filter(Boolean))];
  const topicIds = [...new Set(rawSongs.map((s) => s.topicId).filter(Boolean))];

  const [singers, topics] = await Promise.all([
    singerRepository.findByIds(singerIds),
    topicRepository.findByIds(topicIds),
  ]);

  const singerMap = new Map(singers.map((s: any) => [String(s._id), s]));
  const topicMap = new Map(topics.map((t: any) => [String(t._id), t]));

  return rawSongs.map((song) => {
    const singer = singerMap.get(String(song.singerId));
    const topic = topicMap.get(String(song.topicId));

    const singerSummary: SingerSummary | null = singer
      ? { fullName: singer.fullName, slug: singer.slug }
      : null;

    const topicSummary: TopicSummary | null = topic
      ? { _id: String(topic._id), title: topic.title, slug: topic.slug }
      : null;

    return {
      _id: String(song._id),
      title: song.title,
      avatar: song.avatar,
      slug: song.slug,
      like: song.like ?? 0,
      listen: song.listen ?? 0,
      createdAt: song.createdAt,
      singer: singerSummary,
      topic: topicSummary,
    };
  });
}

export const homeService = {
  async getDashboardData(): Promise<DashboardData> {
    const [featuredTopics, rawTopTracks, rawNewReleases] = await Promise.all([
      // "Featured Vibes" dùng Topic làm banner vì project chưa có model Playlist riêng
      topicRepository.findFeatured(4),
      songRepository.findTopByListen(10),
      songRepository.findLatest(8),
    ]);

    const [topTracks, newReleases] = await Promise.all([
      enrichSongs(rawTopTracks),
      enrichSongs(rawNewReleases),
    ]);

    return {
      featured: featuredTopics.map((t: any) => ({
        _id: String(t._id),
        title: t.title,
        slug: t.slug,
        avatar: t.avatar,
        description: t.description,
      })),
      topTracks,
      newReleases,
    };
  },
};
