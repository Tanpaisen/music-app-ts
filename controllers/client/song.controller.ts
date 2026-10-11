import { Request, Response } from "express";
import mongoose from "mongoose";
import Song from "../../models/song.model";
import Topic from "../../models/topic.model";
import Singer from "../../models/singer.model";
import FavoriteSong from "../../models/favorite.song.model";
import SongLike from "../../models/song-like.model";
import { songService } from "../../services/song.service";

// Công khai: danh sách bài hát theo chủ đề; giữ Pug của dự án cũ.
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const topic = await Topic.findOne({ slug: req.params.songSlug, deleted: false });
    if (!topic) { res.status(404).json({ message: "Không tìm thấy chủ đề" }); return; }
    const songs = await Song.find({ topicId: String(topic._id), deleted: false }).lean();
    const populated = await Promise.all(songs.map(async song => {
      const singer = song.singerId && mongoose.isValidObjectId(song.singerId)
        ? await Singer.findById(song.singerId).select("fullName").lean()
        : null;
      return { ...song, singer };
    }));
    res.render("client/pages/songs/list", { pageTitle: "Danh sách bài hát", topic, songs: populated });
  } catch (error) {
    console.error("[songs/list]", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await songService.getSongDetail(String(req.params.songSlug));
    if (!data) { res.status(404).json({ code: 404, message: "Không tìm thấy bài hát" }); return; }
    res.json({ code: 200, message: "Thành công", data });
  } catch (error) {
    console.error("[songs/detail]", error);
    res.status(500).json({ code: 500, message: "Lỗi máy chủ" });
  }
};

// Trạng thái like thuộc đúng người đang đăng nhập, dùng để khởi tạo UI.
export const likeState = async (req: Request, res: Response): Promise<void> => {
  const userId = res.locals.authUserId as string;
  const songId = req.params.songId;
  if (!mongoose.isValidObjectId(songId)) { res.status(400).json({ message: "songId không hợp lệ" }); return; }
  try {
    const [liked, song] = await Promise.all([
      SongLike.exists({ userId, songId }),
      Song.findOne({ _id: songId, deleted: false, status: "active" }).select("like"),
    ]);
    if (!song) { res.status(404).json({ message: "Không tìm thấy bài hát" }); return; }
    res.json({ code: 200, liked: Boolean(liked), like: song.like ?? 0 });
  } catch (error) {
    console.error("[songs/likeState]", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Cần requireAuth. Dùng cặp (userId, songId) để chống like trùng.
// MongoDB Atlas (replica set) cho phép transaction để đồng bộ SongLike và số like.
export const like = async (req: Request, res: Response): Promise<void> => {
  const { songId, status } = req.params;
  const userId = res.locals.authUserId as string;
  if (!mongoose.isValidObjectId(songId) || !["like", "unlike"].includes(String(status))) {
    res.status(400).json({ message: "songId hoặc status không hợp lệ" });
    return;
  }
  try {
    const song = await Song.findOne({ _id: songId, deleted: false, status: "active" }).select("_id");
    if (!song) { res.status(404).json({ message: "Không tìm thấy bài hát" }); return; }

    const session = await mongoose.startSession();
    let count = 0;
    try {
      await session.withTransaction(async () => {
        if (status === "like") {
          await SongLike.updateOne(
            { userId, songId },
            { $setOnInsert: { userId, songId } },
            { upsert: true, session }
          );
        } else {
          await SongLike.deleteOne({ userId, songId }).session(session);
        }
        count = await SongLike.countDocuments({ songId }).session(session);
        const result = await Song.updateOne(
          { _id: songId, deleted: false, status: "active" },
          { $set: { like: count } },
          { session }
        );
        if (result.matchedCount !== 1) throw new Error("Song no longer available");
      });
    } finally {
      await session.endSession();
    }
    res.json({ code: 200, message: "Thành công", liked: status === "like", like: count });
  } catch (error: any) {
    // Khi hai request cùng like một bài hát, index unique tránh ghi trùng.
    if (error?.code === 11000 && status === "like") {
      const count = await SongLike.countDocuments({ songId });
      res.json({ code: 200, message: "Đã thích bài hát", liked: true, like: count });
      return;
    }
    console.error("[songs/like]", error);
    res.status(500).json({ message: "Không thể cập nhật lượt thích" });
  }
};

// Cần requireAuth. Tuyệt đối không lấy userId từ body hoặc query.
export const favoritePatch = async (req: Request, res: Response): Promise<void> => {
  const { songId, status } = req.params;
  const userId = res.locals.authUserId as string;
  if (!mongoose.isValidObjectId(songId) || !["favorite", "unfavorite"].includes(String(status))) {
    res.status(400).json({ message: "songId hoặc status không hợp lệ" });
    return;
  }
  try {
    if (status === "favorite") {
      const exists = await Song.exists({ _id: songId, deleted: false, status: "active" });
      if (!exists) { res.status(404).json({ message: "Không tìm thấy bài hát" }); return; }
      await FavoriteSong.updateOne(
        { userId, songId },
        { $set: { deleted: false, deletedAt: null }, $setOnInsert: { userId, songId } },
        { upsert: true }
      );
    } else {
      await FavoriteSong.updateOne(
        { userId, songId, deleted: false },
        { $set: { deleted: true, deletedAt: new Date() } }
      );
    }
    res.json({ code: 200, message: status === "favorite" ? "Đã thêm vào yêu thích" : "Đã xóa yêu thích" });
  } catch (error) {
    console.error("[songs/favoritePatch]", error);
    res.status(500).json({ message: "Không thể cập nhật bài hát yêu thích" });
  }
};

// Trạng thái favorite của bài hát thuộc đúng người đang đăng nhập.
export const favoriteState = async (req: Request, res: Response): Promise<void> => {
  const userId = res.locals.authUserId as string;
  const songId = req.params.songId;
  if (!mongoose.isValidObjectId(songId)) { res.status(400).json({ message: "songId không hợp lệ" }); return; }
  try {
    const found = await FavoriteSong.exists({ userId, songId, deleted: false });
    res.json({ code: 200, favorite: Boolean(found) });
  } catch (error) {
    console.error("[songs/favoriteState]", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// JSON dành cho Next.js. Chỉ trả dữ liệu thuộc user đang đăng nhập.
export const favorite = async (_req: Request, res: Response): Promise<void> => {
  const userId = res.locals.authUserId as string;
  try {
    const favorites = await FavoriteSong.find({ userId, deleted: false })
      .sort({ createdAt: -1 }).lean();
    const data = await Promise.all(favorites.map(async item => {
      const song = await Song.findOne({ _id: item.songId, deleted: false, status: "active" }).lean();
      if (!song) return null;
      const singer = song.singerId && mongoose.isValidObjectId(song.singerId)
        ? await Singer.findById(song.singerId).select("fullName slug").lean()
        : null;
      return { id: String(item._id), song, singer };
    }));
    res.json({ code: 200, data: data.filter(Boolean) });
  } catch (error) {
    console.error("[songs/favorite]", error);
    res.status(500).json({ message: "Không thể lấy bài hát yêu thích" });
  }
};

export const listenPatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const song = await Song.findOneAndUpdate(
      { slug: req.params.songSlug, deleted: false, status: "active" },
      { $inc: { listen: 1 } },
      { new: true }
    );
    if (!song) { res.status(404).json({ code: 404, message: "Không tìm thấy bài hát" }); return; }
    res.json({ code: 200, message: "Đã ghi nhận lượt nghe", listen: song.listen });
  } catch (error) {
    console.error("[songs/listen]", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
