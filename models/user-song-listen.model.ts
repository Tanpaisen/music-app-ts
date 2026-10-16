import mongoose from "mongoose";

// Một thống kê cho mỗi cặp user - bài hát; không lưu thông tin tài khoản trong Meilisearch.
const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    songId: { type: String, required: true },
    listenCount: { type: Number, default: 0, min: 0 },
    lastListenedAt: { type: Date, default: Date.now },
  },
  { collection: "user_song_listens", timestamps: true }
);
schema.index({ userId: 1, songId: 1 }, { unique: true });
schema.index({ userId: 1, listenCount: -1, lastListenedAt: -1 });

export default mongoose.models.UserSongListen ||
  mongoose.model("UserSongListen", schema);
