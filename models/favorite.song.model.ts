import mongoose from "mongoose";

const favoriteSongSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    songId: { type: String, required: true, index: true },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "favorite-songs" }
);

// Trước khi bật chỉ mục duy nhất, cần kiểm tra dữ liệu cũ trùng userId/songId.
favoriteSongSchema.index({ userId: 1, songId: 1 }, { unique: true });

const FavoriteSong = mongoose.model("FavoriteSong", favoriteSongSchema);
export default FavoriteSong;
