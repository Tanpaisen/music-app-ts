import { Request, Response } from "express";
import mongoose from "mongoose";
import Singer from "../../models/singer.model";
import Song from "../../models/song.model";
import SingerFollow from "../../models/singer-follow.model";

function readPositiveInt(value: unknown, fallback: number, max: number): number {
  const candidate = typeof value === "string" ? Number(value) : NaN;
  return Number.isSafeInteger(candidate) && candidate > 0
    ? Math.min(candidate, max)
    : fallback;
}

// GET /api/artists/:artistKey?page=1&limit=12
// Công khai: trang nghệ sĩ; artistKey có thể là slug hoặc Mongo ObjectId.
export const detail = async (req: Request, res: Response): Promise<void> => {
  const artistKey = String(req.params.artistKey || "").trim();
  if (!artistKey || artistKey.length > 160) {
    res.status(400).json({ code: "INVALID_ARTIST", message: "Đường dẫn nghệ sĩ không hợp lệ" });
    return;
  }

  const page = readPositiveInt(req.query.page, 1, 1000);
  const limit = readPositiveInt(req.query.limit, 12, 50);

  try {
    const identifier = mongoose.isValidObjectId(artistKey)
      ? { _id: artistKey }
      : { slug: artistKey };

    const artist = await Singer.findOne({
      ...identifier,
      deleted: false,
      status: "active",
    }).select("_id fullName avatar slug").lean();

    if (!artist) {
      res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy nghệ sĩ" });
      return;
    }

    const singerId = String(artist._id);
    const filter = { singerId, deleted: false, status: "active" };

    const [songs, songCount, followerCount] = await Promise.all([
      Song.find(filter)
        .select("_id title slug avatar listen like")
        .sort({ listen: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Song.countDocuments(filter),
      SingerFollow.countDocuments({ singerId }),
    ]);

    res.json({
      code: 200,
      data: {
        artist: {
          _id: singerId,
          fullName: artist.fullName || "Nghệ sĩ",
          slug: artist.slug || "",
          avatar: artist.avatar || "",
          followerCount,
          songCount,
        },
        songs: songs.map((song) => ({
          _id: String(song._id),
          title: song.title || "Bài hát",
          slug: song.slug || "",
          avatar: song.avatar || "",
          listen: song.listen ?? 0,
          like: song.like ?? 0,
        })),
        pagination: {
          page,
          limit,
          total: songCount,
          totalPages: Math.ceil(songCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("[artists/detail]", error);
    res.status(500).json({ code: 500, message: "Không thể tải thông tin nghệ sĩ" });
  }
};
