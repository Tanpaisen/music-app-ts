import mongoose from "mongoose";

const singerSchema = new mongoose.Schema(
  {
    fullName: String,
    avatar: String,
    status: String,
    slug: String,
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
    m.scheduleMeiliRefresh("singer:" + id, () => m.refreshArtist(id));
  }).catch(error => console.error("[Meili hook singer]", error));
}
singerSchema.post("save", function(doc: any) { queueIndex(String(doc._id)); });
singerSchema.post("findOneAndUpdate", function(doc: any) { if (doc?._id) queueIndex(String(doc._id)); });
singerSchema.post("findOneAndDelete", function(doc: any) { if (doc?._id) queueIndex(String(doc._id)); });
singerSchema.post("updateOne", function() {
  // updateOne does not return the document; look it up using the original filter.
  const query = this as any;
  const filter = query.getFilter();
  if (filter?._id && (typeof filter._id === "string" || filter._id instanceof mongoose.Types.ObjectId)) {
    queueIndex(String(filter._id)); return;
  }
  void query.model.findOne(filter).select("_id").lean()
    .then((doc: any) => { if (doc?._id) queueIndex(String(doc._id)); })
    .catch((error: any) => console.error("[Meili hook singer updateOne]", error));
});
singerSchema.post("deleteOne", function() {
  const filter = (this as any).getFilter?.();
  if (filter?._id) queueIndex(String(filter._id));
});

const Singer = mongoose.model("Singer", singerSchema, "singers");

export default Singer;