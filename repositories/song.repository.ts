import Song from "../models/song.model";

// Không lấy "album"/"duration" vì Song schema không có 2 field này
const SONG_SELECT = "title avatar slug like listen singerId topicId createdAt";

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
};
