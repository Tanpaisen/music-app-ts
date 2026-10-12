import { Request, Response } from "express";
import mongoose from "mongoose";
import Singer from "../../models/singer.model";
import Topic from "../../models/topic.model";
import Song from "../../models/song.model";
import SongLike from "../../models/song-like.model";
import { DEFAULT_TOPIC_CATEGORY } from "../../config/topic-categories";
import { categoryExists, listCategories } from "../../services/topic-category.service";
import { ensureMeiliIndex, getMeiliClient } from "../../services/meilisearch.service";

function pageOptions(req: Request) {
  const rawPage = Number(req.query.page);
  const rawLimit = Number(req.query.limit);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 100000) : 1;
  const limit = Number.isSafeInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 36) : 12;
  return { page, limit, skip: (page - 1) * limit };
}

// All keyword queries use Meilisearch; MongoDB is used for unfiltered browsing only.
const keyword = (req: Request) => typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";

export const artists = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = pageOptions(req);
    const q = keyword(req);
    let data: any[], total: number;
    if (q) {
      await ensureMeiliIndex("artists");
      const result = await getMeiliClient().index("artists").search(q, {
        filter: 'deleted = false AND status = "active"', offset: skip, limit,
      });
      data = result.hits.map((hit: any) => ({ _id: hit.id, fullName: hit.fullName, avatar: hit.avatar, slug: hit.slug }));
      total = result.estimatedTotalHits ?? data.length;
    } else {
      const filter = { deleted: false, status: "active" };
      [data, total] = await Promise.all([
        Singer.find(filter).select("fullName avatar slug").sort({ fullName: 1, _id: 1 }).skip(skip).limit(limit).lean(),
        Singer.countDocuments(filter),
      ]);
    }
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
    const q = keyword(req);
    const category = typeof req.query.category === "string" ? req.query.category : "";
    if (category && !await categoryExists(category)) {
      res.status(400).json({ message: "Danh mục không hợp lệ" }); return;
    }
    let data: any[], total: number;
    if (q) {
      await ensureMeiliIndex("topics");
      const result = await getMeiliClient().index("topics").search(q, {
        filter: `deleted = false AND status = "active"${category ? (category === "khac" ? ' AND (categoryKey = "khac" OR categoryKey IS NULL)' : ` AND categoryKey = "${category}"`) : ""}`,
        offset: skip, limit,
      });
      data = result.hits.map((hit: any) => ({ _id: hit.id, title: hit.title, slug: hit.slug, avatar: hit.avatar, description: hit.description, categoryKey: hit.categoryKey || DEFAULT_TOPIC_CATEGORY }));
      total = result.estimatedTotalHits ?? data.length;
    } else {
      const filter: Record<string, unknown> = { deleted: false, status: "active" };
      if (category) filter.categoryKey = category === "khac" ? { $in: ["khac", null] } : category;
      [data, total] = await Promise.all([
        Topic.find(filter).select("title description slug avatar categoryKey featured sortOrder").sort({ sortOrder: 1, title: 1, _id: 1 }).skip(skip).limit(limit).lean(),
        Topic.countDocuments(filter),
      ]);
    }
    res.setHeader("Cache-Control", "no-store");
    res.json({ code: 200, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[catalog/topics]", error);
    res.status(500).json({ message: "Không thể tải danh sách chủ đề" });
  }
};

// GET /api/catalog/topics/groups — duyệt nhóm bằng MongoDB, tìm từ khóa vẫn qua Meilisearch.
// Chỉ trả tối đa 6 chủ đề mỗi nhóm để trang tải nhanh; "Xem tất cả" dùng /topics?category=...
export const topicGroups = async (_req: Request, res: Response): Promise<void> => {
  try {
    const visible = { deleted: false, status: "active" } as const;
    const categories = await listCategories(true);
    const groups = await Promise.all(categories.map(async category => {
      const filter: Record<string, unknown> = { ...visible, categoryKey: category.key === "khac" ? { $in: ["khac", null] } : category.key };
      const [items, total] = await Promise.all([
        Topic.find(filter).select("title slug avatar description categoryKey featured sortOrder")
          .sort({ sortOrder: 1, createdAt: -1 }).limit(6).lean(),
        Topic.countDocuments(filter),
      ]);
      return { ...category, total, topics: items };
    }));
    const featured = await Topic.find({ ...visible, featured: true })
      .select("title slug avatar description categoryKey sortOrder")
      .sort({ sortOrder: 1, createdAt: -1 }).limit(8).lean();
    res.setHeader("Cache-Control", "no-store");
    res.json({ code: 200, featured, groups: groups.filter(g => g.total > 0) });
  } catch (error) {
    console.error("[catalog/topicGroups]", error);
    res.status(500).json({ message: "Không thể tải các nhóm chủ đề" });
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
