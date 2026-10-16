import mongoose from "mongoose";

// Phiên phát ngắn hạn để chống ghi nhận trùng và xác minh thời gian máy chủ >= 30s.
const schema = new mongoose.Schema(
  {
    playId: { type: String, required: true, unique: true },
    songId: { type: String, required: true },
    userId: { type: String, default: null },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
  },
  { collection: "song_play_sessions", timestamps: true }
);
schema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

export default mongoose.models.SongPlaySession ||
  mongoose.model("SongPlaySession", schema);
