import mongoose from "mongoose";

// Một người dùng chỉ được theo dõi mỗi nghệ sĩ một lần.
const singerFollowSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    singerId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: "singer_follows" }
);

singerFollowSchema.index({ userId: 1, singerId: 1 }, { unique: true });
singerFollowSchema.index({ userId: 1, createdAt: -1 });

const SingerFollow = mongoose.model("SingerFollow", singerFollowSchema, "singer_follows");
export default SingerFollow;
