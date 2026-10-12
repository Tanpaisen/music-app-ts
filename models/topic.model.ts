import mongoose from 'mongoose';
import { DEFAULT_TOPIC_CATEGORY } from '../config/topic-categories';
// @ts-ignore
import slug from 'mongoose-slug-updater';
mongoose.plugin(slug);

const topicSchema = new mongoose.Schema({
    title: String,
    avatar: String,
    description: String,
    categoryKey: {
        type: String,
        default: DEFAULT_TOPIC_CATEGORY,
        index: true,
    },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0, min: 0 },
    status: String,
    slug: {
        type: String,
        slug: 'title',
        unique: true
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deleteAt: Date,
}, {
    timestamps: true
});
topicSchema.index({ deleted: 1, status: 1, categoryKey: 1, sortOrder: 1 });
// Incremental index refresh after DB writes. MongoDB always remains the source of truth.
// Dynamic import avoids cycles while models are being initialized.
function queueIndex(id: string) {
  import("../services/meilisearch.service").then(m => {
    m.scheduleMeiliRefresh("topic:" + id, () => m.refreshTopic(id));
  }).catch(error => console.error("[Meili hook topic]", error));
}
topicSchema.post("save", function(doc: any) { queueIndex(String(doc._id)); });
topicSchema.post("findOneAndUpdate", function(doc: any) { if (doc?._id) queueIndex(String(doc._id)); });
topicSchema.post("findOneAndDelete", function(doc: any) { if (doc?._id) queueIndex(String(doc._id)); });
topicSchema.post("updateOne", function() {
  // updateOne does not return the document; look it up using the original filter.
  const query = this as any;
  const filter = query.getFilter();
  if (filter?._id && (typeof filter._id === "string" || filter._id instanceof mongoose.Types.ObjectId)) {
    queueIndex(String(filter._id)); return;
  }
  void query.model.findOne(filter).select("_id").lean()
    .then((doc: any) => { if (doc?._id) queueIndex(String(doc._id)); })
    .catch((error: any) => console.error("[Meili hook topic updateOne]", error));
});
topicSchema.post("deleteOne", function() {
  const filter = (this as any).getFilter?.();
  if (filter?._id) queueIndex(String(filter._id));
});

const Topic = mongoose.model('Topic', topicSchema, 'topics');

export default Topic;