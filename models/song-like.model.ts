import mongoose from "mongoose";

const songLikeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    songId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: "song_likes" }
);

// Một user chỉ like một bài hát đúng một lần, kể cả khi gửi yêu cầu đồng thời.
songLikeSchema.index({ userId: 1, songId: 1 }, { unique: true });

const SongLike = mongoose.model("SongLike", songLikeSchema);
export default SongLike;
