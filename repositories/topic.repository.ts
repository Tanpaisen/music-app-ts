import Topic from "../models/topic.model";

export const topicRepository = {
  findFeatured(limit: number) {
    return Topic.find({ deleted: false, status: "active" })
      .select("title slug avatar description")
      .limit(limit)
      .lean();
  },

  findByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return Topic.find({ _id: { $in: ids } }).select("title slug").lean();
  },
};
