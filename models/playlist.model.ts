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

// Incremental index refresh after DB writes. MongoDB always remains the source of truth.
// Dynamic import avoids cycles while models are being initialized.
function queueIndex(id: string) {
  import("../services/meilisearch.service").then(m => {
    m.scheduleMeiliRefresh("playlist:" + id, () => m.refreshPlaylist(id));
  }).catch(error => console.error("[Meili hook playlist]", error));
}
playlistSchema.post("save", function(doc: any) { queueIndex(String(doc._id)); });
playlistSchema.post("findOneAndUpdate", function(doc: any) { if (doc?._id) queueIndex(String(doc._id)); });
playlistSchema.post("findOneAndDelete", function(doc: any) { if (doc?._id) queueIndex(String(doc._id)); });
playlistSchema.post("updateOne", function() {
  // updateOne does not return the document; look it up using the original filter.
  const query = this as any;
  const filter = query.getFilter();
  if (filter?._id && (typeof filter._id === "string" || filter._id instanceof mongoose.Types.ObjectId)) {
    queueIndex(String(filter._id)); return;
  }
  void query.model.findOne(filter).select("_id").lean()
    .then((doc: any) => { if (doc?._id) queueIndex(String(doc._id)); })
    .catch((error: any) => console.error("[Meili hook playlist updateOne]", error));
});
playlistSchema.post("deleteOne", function() {
  const filter = (this as any).getFilter?.();
  if (filter?._id) queueIndex(String(filter._id));
});

const Playlist = mongoose.model("Playlist", playlistSchema, "playlists");
export default Playlist;
