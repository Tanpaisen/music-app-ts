import mongoose from "mongoose";
// @ts-ignore
import slug from 'mongoose-slug-updater';

mongoose.plugin(slug);

const songSchema = new mongoose.Schema(
  {
    title: String,
    avatar: String,
    description: String,
    singerId: {
      type: String,
      ref: "Singer"
    },
    topicId: String,
    albumId: { type: String, default: "", index: true },
    trackNumber: { type: Number, default: 0, min: 0 },
    like: { type: Number, default: 0, min: 0 },
    listen: {
      type: Number,
      default: 0,
    },
    lyrics: String,
    audio: String,
    status: String,
    slug: {
      type: String,
      slug: "title",
      unique: true
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Incremental index refresh after DB writes. MongoDB always remains the source of truth.
// Dynamic import avoids cycles while models are being initialized.
function queueIndex(id: string) {
  import("../services/meilisearch.service").then(m => {
    m.scheduleMeiliRefresh("song:" + id, () => m.refreshSong(id));
  }).catch(error => console.error("[Meili hook song]", error));
}
songSchema.post("save", function(doc: any) { queueIndex(String(doc._id)); });
songSchema.post("findOneAndUpdate", function(doc: any) { if (doc?._id) queueIndex(String(doc._id)); });
songSchema.post("findOneAndDelete", function(doc: any) { if (doc?._id) queueIndex(String(doc._id)); });
songSchema.post("updateOne", function() {
  // updateOne does not return the document; look it up using the original filter.
  const query = this as any;
  const filter = query.getFilter();
  if (filter?._id && (typeof filter._id === "string" || filter._id instanceof mongoose.Types.ObjectId)) {
    queueIndex(String(filter._id)); return;
  }
  void query.model.findOne(filter).select("_id").lean()
    .then((doc: any) => { if (doc?._id) queueIndex(String(doc._id)); })
    .catch((error: any) => console.error("[Meili hook song updateOne]", error));
});
songSchema.post("deleteOne", function() {
  const filter = (this as any).getFilter?.();
  if (filter?._id) queueIndex(String(filter._id));
});

const Song = mongoose.model("Song", songSchema, "songs");

export default Song;