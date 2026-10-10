import Song from "../models/song.model";

const SONG_SELECT = "title avatar slug like listen singerId topicId audio lyrics description createdAt";

export const songRepository = {
  findTopByListen(limit: number) {
    return Song.find({ deleted: false, status: "active" })
      .sort({ listen: -1 })
      .limit(limit)
      .select(SONG_SELECT)
      .lean();
  },

  findLatest(limit: number) {
    return Song.find({ deleted: false, status: "active" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(SONG_SELECT)
      .lean();
  },

  // Tìm bài hát theo slug, lấy đủ field cho trang detail
  findBySlug(slug: string) {
    return Song.findOne({ slug, deleted: false, status: "active" })
      .select("title avatar slug like listen singerId topicId audio lyrics description createdAt")
      .lean();
  },

  // Gợi ý bài hát cùng chủ đề (loại trừ bài hiện tại)
  findRelated(topicId: string | null | undefined, excludeSlug: string, limit: number) {
    if (!topicId) return Promise.resolve([]);
    return Song.find({
      topicId,
      slug: { $ne: excludeSlug },
      deleted: false,
      status: "active",
    })
      .sort({ listen: -1 })
      .limit(limit)
      .select("title avatar slug like listen singerId")
      .lean();
  },

  // Tăng lượt nghe khi vào trang detail
  incrementListen(slug: string) {
    return Song.updateOne({ slug }, { $inc: { listen: 1 } });
  },
};
