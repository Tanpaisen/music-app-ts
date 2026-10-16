import mongoose from "mongoose";

// Một bình luận thuộc một bài hát và một tài khoản đã đăng nhập.
const songCommentSchema = new mongoose.Schema(
  {
    songId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
  },
  { timestamps: true, collection: "song_comments" }
);

songCommentSchema.index({ songId: 1, createdAt: -1, _id: -1 });

const SongComment = mongoose.model("SongComment", songCommentSchema, "song_comments");
export default SongComment;
