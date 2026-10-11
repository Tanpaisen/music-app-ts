import mongoose from "mongoose";

// Playlist thuộc riêng từng tài khoản; songIds lưu các _id bài hát theo thứ tự thêm.
const playlistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    songIds: { type: [String], default: [] },
  },
  { timestamps: true, collection: "playlists" }
);

playlistSchema.index({ userId: 1, updatedAt: -1 });

const Playlist = mongoose.model("Playlist", playlistSchema, "playlists");
export default Playlist;
