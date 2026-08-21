import Singer from "../models/singer.model";

export const singerRepository = {
  findByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return Singer.find({ _id: { $in: ids } }).select("fullName slug").lean();
  },
};
