import { Request, Response } from "express";
import mongoose from "mongoose";
import Singer from "../../models/singer.model";
import Topic from "../../models/topic.model";
import Song from "../../models/song.model";
import SongLike from "../../models/song-like.model";

function pageOptions(req: Request) {
  const rawPage = Number(req.query.page);
  const rawLimit = Number(req.query.limit);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 100000) : 1;
  const limit = Number.isSafeInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 36) : 12;
  return { page, limit, skip: (page - 1) * limit };
}

function safeQuery(req: Request) {
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
  return q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const artists = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = pageOptions(req);
    const q = safeQuery(req);
    const filter = { deleted: false, status: "active", ...(q ? { fullName: { $regex: q, $options: "i" } } : {}) };
    const [data, total] = await Promise.all([
      Singer.find(filter).select("fullName avatar slug").sort({ fullName: 1, _id: 1 }).skip(skip).limit(limit).lean(),
      Singer.countDocuments(filter),
    ]);
    res.setHeader("Cache-Control", "no-store");
    res.json({ code: 200, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[catalog/artists]", error);
    res.status(500).json({ message: "Không thể tải danh sách ca sĩ" });
  }
};

export const topics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = pageOptions(req);
    const q = safeQuery(req);
    const filter = { deleted: false, status: "active", ...(q ? { title: { $regex: q, $options: "i" } } : {}) };
    const [data, total] = await Promise.all([
      Topic.find(filter).select("title description slug avatar").sort({ title: 1, _id: 1 }).skip(skip).limit(limit).lean(),
      Topic.countDocuments(filter),
    ]);
    res.setHeader("Cache-Control", "no-store");
    res.json({ code: 200, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[catalog/topics]", error);
    res.status(500).json({ message: "Không thể tải danh sách chủ đề" });
  }
};

export const topicDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = pageOptions(req);
    const key = req.params.topicSlug;
    const identity = mongoose.isValidObjectId(key) ? { $or: [{ slug: key }, { _id: key }] } : { slug: key };
    const topic = await Topic.findOne({ ...identity, deleted: false, status: "active" })
      .select("title slug description avatar").lean();
    if (!topic) { res.status(404).json({ message: "Không tìm thấy chủ đề" }); return; }
    const filter = { topicId: String(topic._id), deleted: false, status: "active" };
    const [songs, total] = await Promise.all([
      Song.find(filter).select("title slug avatar singerId listen like").sort({ listen: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      Song.countDocuments(filter),
    ]);
    const singerIds = [...new Set(songs.map(song => String(song.singerId ?? "")).filter(id => mongoose.isValidObjectId(id)))];
    const singers = await Singer.find({ _id: { $in: singerIds }, deleted: false }).select("fullName slug").lean();
    const singerMap = new Map(singers.map(s => [String(s._id), { fullName: s.fullName, slug: s.slug }]));
    const data = songs.map(song => ({
      _id: song._id, title: song.title, slug: song.slug, avatar: song.avatar,
      listen: song.listen ?? 0, like: song.like ?? 0,
      singer: singerMap.get(String(song.singerId)) ?? null,
    }));
    res.setHeader("Cache-Control", "no-store");
    res.json({ code: 200, data: { topic, songs: data }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[catalog/topicDetail]", error);
    res.status(500).json({ message: "Không thể tải bài hát của chủ đề" });
  }
};

// Danh sách đã thích, dựa trên dữ liệu SongLike có sẵn (khác Favorite/Thư viện).
export const liked = async (_req: Request, res: Response): Promise<void> => {
  try {
    const userId = res.locals.authUserId as string;
    const likedSongs = await SongLike.find({ userId }).sort({ createdAt: -1 }).select("songId").lean();
    const songIds = likedSongs.map(item => item.songId);
    const songs = await Song.find({ _id: { $in: songIds }, deleted: false, status: "active" })
      .select("title slug avatar singerId listen like").lean();
    const songMap = new Map(songs.map(song => [String(song._id), song]));
    const singerIds = [...new Set(songs.map(song => String(song.singerId ?? "")).filter(id => mongoose.isValidObjectId(id)))];
    const singers = await Singer.find({ _id: { $in: singerIds }, deleted: false }).select("fullName slug").lean();
    const singerMap = new Map(singers.map(s => [String(s._id), { fullName: s.fullName, slug: s.slug }]));
    const data = songIds.map(id => songMap.get(id)).filter((song): song is NonNullable<typeof song> => Boolean(song))
      .map(song => ({
        _id: song._id, title: song.title, slug: song.slug, avatar: song.avatar,
        listen: song.listen ?? 0, like: song.like ?? 0,
        singer: singerMap.get(String(song.singerId)) ?? null,
      }));
    res.setHeader("Cache-Control", "no-store");
    res.json({ code: 200, data });
  } catch (error) {
    console.error("[catalog/liked]", error);
    res.status(500).json({ message: "Không thể tải các bài hát đã thích" });
  }
};
