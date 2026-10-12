import type { Request, Response } from "express";
import mongoose from "mongoose";
import Album from "../../models/album.model";
import Singer from "../../models/singer.model";
import Song from "../../models/song.model";

const VISIBLE = { deleted: false, status: "active" } as const;
function paging(req: Request) {
  const n = Number(req.query.page);
  const l = Number(req.query.limit);
  const page = Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 1;
  const limit = Number.isSafeInteger(l) && l > 0 ? Math.min(l, 50) : 12;
  return { page, limit, skip: (page - 1) * limit };
}
async function singersFor(ids: string[]) {
  const unique = [...new Set(ids)].filter(mongoose.isValidObjectId);
  const singers = await Singer.find({ _id: { $in: unique }, deleted: false })
    .select("fullName slug avatar").lean();
  return new Map(singers.map(s => [String(s._id),
    { _id: String(s._id), fullName: s.fullName ?? "", slug: s.slug ?? "", avatar: s.avatar ?? "" }]));
}

// GET /api/albums?page=1&limit=12
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = paging(req);
    const [albums, total] = await Promise.all([
      Album.find(VISIBLE).select("title slug avatar description singerId releaseDate")
        .sort({ releaseDate: -1, createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      Album.countDocuments(VISIBLE),
    ]);
    const singers = await singersFor(albums.map(a => String(a.singerId || "")));
    const counts = await Song.aggregate([
      { $match: { deleted: false, status: "active", albumId: { $in: albums.map(a => String(a._id)) } } },
      { $group: { _id: "$albumId", count: { $sum: 1 } } },
    ]);
    const songCounts = new Map(counts.map(row => [String(row._id), Number(row.count)]));
    res.setHeader("Cache-Control", "no-store");
    res.json({ code: 200, data: albums.map(a => ({ _id: String(a._id), title: a.title,
      slug: a.slug || "", avatar: a.avatar || "", description: a.description || "",
      releaseDate: a.releaseDate || null, singer: singers.get(String(a.singerId)) || null,
      songCount: songCounts.get(String(a._id)) || 0,
    })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { console.error("[albums/index]", err); res.status(500).json({ message: "Không tải được album" }); }
};

// GET /api/albums/:albumSlug — bài hát nằm đúng trong album, xếp từ cũ đến mới theo ngày tạo.
export const detail = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = String(req.params.albumSlug || "");
    const identity = mongoose.isValidObjectId(key) ? { $or: [{ slug: key }, { _id: key }] } : { slug: key };
    const album = await Album.findOne({ ...identity, ...VISIBLE })
      .select("title slug avatar description singerId releaseDate").lean();
    if (!album) { res.status(404).json({ code: 404, message: "Không tìm thấy album" }); return; }
    const { page, limit, skip } = paging(req);
    const filter = { albumId: String(album._id), deleted: false, status: "active" };
    const [songs, total] = await Promise.all([
      Song.find(filter).select("title slug avatar singerId listen like audio")
        .sort({ trackNumber: 1, createdAt: 1, _id: 1 }).skip(skip).limit(limit).lean(),
      Song.countDocuments(filter),
    ]);
    const singerMap = await singersFor([String(album.singerId || ""), ...songs.map(s => String(s.singerId || ""))]);
    res.setHeader("Cache-Control", "no-store");
    res.json({ code: 200, data: { album: {
        _id: String(album._id), title: album.title, slug: album.slug || "", avatar: album.avatar || "",
        description: album.description || "", releaseDate: album.releaseDate || null,
        singer: singerMap.get(String(album.singerId)) || null,
      }, songs: songs.map(s => ({
        _id: String(s._id), title: s.title || "", slug: s.slug || "", avatar: s.avatar || "",
        listen: s.listen ?? 0, like: s.like ?? 0, audio: s.audio || null,
        singer: singerMap.get(String(s.singerId)) || null,
      })) }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { console.error("[albums/detail]", err); res.status(500).json({ message: "Không tải được album" }); }
};
