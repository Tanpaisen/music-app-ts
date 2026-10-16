import { songRepository } from "../repositories/song.repository";
import { singerRepository } from "../repositories/singer.repository";
import { topicRepository } from "../repositories/topic.repository";
import { SongDetailData, SongSummary } from "../types/song.types";


export const songService = {
  async getSongDetail(slug: string): Promise<SongDetailData | null> {
    const raw = await songRepository.findBySlug(slug);
    if (!raw) return null;

    const singerIds = raw.singerId ? [String(raw.singerId)] : [];
    const topicIds = raw.topicId ? [String(raw.topicId)] : [];

    const [singers, topics, rawRelated] = await Promise.all([
      singerRepository.findByIds(singerIds),
      topicRepository.findByIds(topicIds),
      // Gợi ý bài hát cùng chủ đề
      raw.topicId != null
        ? songRepository.findRelated(String(raw.topicId), slug, 5)
        : Promise.resolve([]),
    ]);

    const singer = singers[0] ?? null;
    const topic = topics[0] ?? null;

    // Gắn singer vào từng bài gợi ý
    const relatedSingerIds = [...new Set(rawRelated.map((s: any) => String(s.singerId)).filter(Boolean))];
    const relatedSingers = await singerRepository.findByIds(relatedSingerIds);
    const singerMap = new Map(relatedSingers.map((s: any) => [String(s._id), s]));

    const related: SongSummary[] = rawRelated.map((s: any) => {
      const rs = singerMap.get(String(s.singerId));
      return {
        _id: String(s._id),
        title: s.title,
        avatar: s.avatar,
        slug: s.slug,
        like: s.like ?? 0,
        listen: s.listen ?? 0,
        singer: rs ? { fullName: rs.fullName, slug: (rs as any).slug } : null,
      };
    });
  
    return {
      song: {
        _id: String(raw._id),
        title: raw.title ?? "",
        avatar: raw.avatar ?? "",
        slug: raw.slug ?? "",
        like: raw.like ?? 0,
        listen: raw.listen ?? 0,
        audio: (raw as any).audio ?? null,
        lyrics: (raw as any).lyrics ?? null,
        description: (raw as any).description ?? null,
        createdAt: (raw as any).createdAt,

        singer: singer
          ? {
              _id: String(singer._id),
              fullName: singer.fullName ?? "",
              slug: (singer as any).slug ?? undefined,
            }
          : null,

        topic: topic
          ? {
              _id: String(topic._id),
              title: topic.title ?? "",
              slug: topic.slug ?? "",
              avatar: (topic as any).avatar ?? undefined,
            }
          : null,
      },
      related,
    };
  },
};