import { Request, Response } from "express";
import mongoose from "mongoose";
import Playlist from "../../models/playlist.model";
import Song from "../../models/song.model";
import Singer from "../../models/singer.model";

// Mọi API phải được gắn requireAuth trong playlist.route.ts.
// Không bao giờ lấy userId từ params, body hoặc query.
const owner = (res: Response): string => res.locals.authUserId as string;
const isId = (value: string): boolean => mongoose.isValidObjectId(value);

const summary = (playlist: any, songId?: string) => ({
  id: String(playlist._id),
  name: playlist.name,
  description: playlist.description ?? "",
  songCount: playlist.songIds?.length ?? 0,
  ...(songId ? { containsSong: (playlist.songIds ?? []).includes(songId) } : {}),
  createdAt: playlist.createdAt,
  updatedAt: playlist.updatedAt,
});

// GET /api/playlists? songId=... (không bắt buộc)
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const value = req.query.songId;
    if (value !== undefined && (typeof value !== "string" || !isId(value))) {
      res.status(400).json({ code: "INVALID_SONG_ID", message: "songId không hợp lệ" });
      return;
    }
    const songId = typeof value === "string" ? value : undefined;
    const playlists = await Playlist.find({ userId: owner(res) }).sort({ updatedAt: -1 }).lean();
    res.setHeader("Cache-Control", "no-store");
    res.json({ code: 200, data: playlists.map((p) => summary(p, songId)) });
  } catch (error) {
    console.error("[playlists/list]", error);
    res.status(500).json({ message: "Không tải được playlist" });
  }
};

// POST /api/playlists {name, description?}
export const create = async (req: Request, res: Response): Promise<void> => {
  const { name, description = "" } = req.body ?? {};
  if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 80 ||
      typeof description !== "string" || description.trim().length > 500) {
    res.status(400).json({ message: "Tên playlist phải từ 1–80 ký tự; mô tả tối đa 500 ký tự" });
    return;
  }
  try {
    const playlist = await Playlist.create({
      userId: owner(res), name: name.trim(), description: description.trim(), songIds: [],
    });
    res.status(201).json({ code: 201, message: "Đã tạo playlist", data: summary(playlist) });
  } catch (error) {
    console.error("[playlists/create]", error);
    res.status(500).json({ message: "Không thể tạo playlist" });
  }
};

// GET /api/playlists/:playlistId
export const detail = async (req: Request, res: Response): Promise<void> => {
  const playlistId = String(req.params.playlistId);
  if (!isId(playlistId)) { res.status(400).json({ message: "playlistId không hợp lệ" }); return; }
  try {
    const playlist = await Playlist.findOne({ _id: playlistId, userId: owner(res) }).lean();
    if (!playlist) { res.status(404).json({ message: "Không tìm thấy playlist" }); return; }

    // Lấy các bài còn hoạt động, vẫn giữ thứ tự người dùng đã thêm.
    const songIds = playlist.songIds ?? [];
    const rawSongs = await Song.find({ _id: { $in: songIds }, deleted: false, status: "active" })
      .select("title slug avatar singerId like listen").lean();
    const singerIds = [...new Set(rawSongs.map((s) => String(s.singerId ?? "")).filter(isId))];
    const singers = await Singer.find({ _id: { $in: singerIds } }).select("fullName slug").lean();
    const singerMap = new Map(singers.map((s) => [String(s._id), { fullName: s.fullName, slug: s.slug }]));
    const songMap = new Map(rawSongs.map((s) => [String(s._id), {
      _id: String(s._id), title: s.title, slug: s.slug, avatar: s.avatar,
      like: s.like ?? 0, listen: s.listen ?? 0,
      singer: singerMap.get(String(s.singerId)) ?? null,
    }]));
    const songs = songIds.map((id) => songMap.get(id)).filter((song) => song != null);
    res.setHeader("Cache-Control", "no-store");
    res.json({ code: 200, data: { ...summary(playlist), songs } });
  } catch (error) {
    console.error("[playlists/detail]", error);
    res.status(500).json({ message: "Không tải được playlist" });
  }
};

// PATCH /api/playlists/:playlistId {name?, description?}
export const update = async (req: Request, res: Response): Promise<void> => {
  const playlistId = String(req.params.playlistId);
  if (!isId(playlistId)) { res.status(400).json({ message: "playlistId không hợp lệ" }); return; }
  const changes: { name?: string; description?: string } = {};
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "name")) {
    if (typeof req.body.name !== "string" || req.body.name.trim().length < 1 || req.body.name.trim().length > 80) {
      res.status(400).json({ message: "Tên playlist phải từ 1–80 ký tự" }); return;
    }
    changes.name = req.body.name.trim();
  }
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "description")) {
    if (typeof req.body.description !== "string" || req.body.description.trim().length > 500) {
      res.status(400).json({ message: "Mô tả không được vượt quá 500 ký tự" }); return;
    }
    changes.description = req.body.description.trim();
  }
  if (Object.keys(changes).length === 0) {
    res.status(400).json({ message: "Chưa có thông tin cần cập nhật" }); return;
  }
  try {
    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, userId: owner(res) }, { $set: changes }, { new: true, runValidators: true }
    );
    if (!playlist) { res.status(404).json({ message: "Không tìm thấy playlist" }); return; }
    res.json({ code: 200, message: "Đã cập nhật playlist", data: summary(playlist) });
  } catch (error) {
    console.error("[playlists/update]", error);
    res.status(500).json({ message: "Không thể cập nhật playlist" });
  }
};

// DELETE /api/playlists/:playlistId
export const remove = async (req: Request, res: Response): Promise<void> => {
  const playlistId = String(req.params.playlistId);
  if (!isId(playlistId)) { res.status(400).json({ message: "playlistId không hợp lệ" }); return; }
  try {
    const playlist = await Playlist.findOneAndDelete({ _id: playlistId, userId: owner(res) });
    if (!playlist) { res.status(404).json({ message: "Không tìm thấy playlist" }); return; }
    res.json({ code: 200, message: "Đã xóa playlist" });
  } catch (error) {
    console.error("[playlists/remove]", error);
    res.status(500).json({ message: "Không thể xóa playlist" });
  }
};

// PUT /api/playlists/:playlistId/songs/:songId - thêm bài, chống trùng bằng $addToSet.
export const addSong = async (req: Request, res: Response): Promise<void> => {
  const playlistId = String(req.params.playlistId);
  const songId = String(req.params.songId);
  if (!isId(playlistId) || !isId(songId)) {
    res.status(400).json({ message: "playlistId hoặc songId không hợp lệ" }); return;
  }
  try {
    const exists = await Song.exists({ _id: songId, deleted: false, status: "active" });
    if (!exists) { res.status(404).json({ message: "Không tìm thấy bài hát" }); return; }
    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, userId: owner(res) },
      { $addToSet: { songIds: songId } },
      { returnDocument: "after" }
    );
    if (!playlist) { res.status(404).json({ message: "Không tìm thấy playlist" }); return; }
    res.json({ code: 200, message: "Đã thêm bài hát", data: summary(playlist, songId) });
  } catch (error) {
    console.error("[playlists/addSong]", error);
    res.status(500).json({ message: "Không thể thêm bài hát" });
  }
};

// DELETE /api/playlists/:playlistId/songs/:songId
export const removeSong = async (req: Request, res: Response): Promise<void> => {
  const playlistId = String(req.params.playlistId);
  const songId = String(req.params.songId);
  if (!isId(playlistId) || !isId(songId)) {
    res.status(400).json({ message: "playlistId hoặc songId không hợp lệ" }); return;
  }
  try {
    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, userId: owner(res) },
      { $pull: { songIds: songId } },
      { returnDocument: "after" }
    );
    if (!playlist) { res.status(404).json({ message: "Không tìm thấy playlist" }); return; }
    res.json({ code: 200, message: "Đã bỏ bài hát khỏi playlist", data: summary(playlist, songId) });
  } catch (error) {
    console.error("[playlists/removeSong]", error);
    res.status(500).json({ message: "Không thể bỏ bài hát" });
  }
};
