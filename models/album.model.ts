import mongoose from "mongoose";
// @ts-ignore — typings for mongoose-slug-updater are not provided by the original project.
import slug from "mongoose-slug-updater";
mongoose.plugin(slug);

const albumSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  avatar: { type: String, default: "" },
  description: { type: String, default: "" },
  singerId: { type: String, default: "", index: true },
  releaseDate: { type: Date, default: null },
  slug: { type: String, slug: "title", unique: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

albumSchema.index({ deleted: 1, status: 1, createdAt: -1 });
type AlbumData = mongoose.InferSchemaType<typeof albumSchema>;

const Album: mongoose.Model<AlbumData> =
  (mongoose.models.Album as mongoose.Model<AlbumData> | undefined)
  ?? mongoose.model<AlbumData>("Album", albumSchema, "albums");

export default Album;
