import type { Request, Response } from "express";
import mongoose from "mongoose";
import Album from "../../models/album.model";
import Song from "../../models/song.model";
import Singer from "../../models/singer.model";
import { systemConfig } from "../../config/system";

const base = `/${systemConfig.prefixAdmin}/albums`;
const validId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.isValidObjectId(id);
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const image = (value: unknown) => typeof value === "string" ? value : (Array.isArray(value) && typeof value[0] === "string" ? value[0] : "");

function parseDate(value: unknown): Date | null {
  const raw = text(value);
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error("INVALID_DATE");
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) throw new Error("INVALID_DATE");
  return date;
}
async function fields(req: Request) {
  const title = text(req.body?.title);
  const singerId = text(req.body?.singerId);
  if (!title || title.length > 160) throw new Error("INVALID_TITLE");
  if (singerId && (!validId(singerId) || !await Singer.exists({ _id: singerId, deleted: false }))) {
    throw new Error("INVALID_SINGER");
  }
  return {
    title,
    singerId,
    description: text(req.body?.description),
    releaseDate: parseDate(req.body?.releaseDate),
    status: (req.body?.status === "inactive" ? "inactive" : "active") as "active" | "inactive",
  };
}
function onError(res: Response, err: unknown) {
  const code = err instanceof Error ? err.message : "";
  if (code.startsWith("INVALID_")) { res.status(400).send("Dữ liệu album không hợp lệ. Kiểm tra tên, ca sĩ và ngày phát hành."); return; }
  if ((err as { code?: number })?.code === 11000) { res.status(409).send("Album trùng slug. Hãy chọn tên khác."); return; }
  console.error("[admin/albums]", err);
  res.status(500).send("Có lỗi khi lưu album.");
}

export const index = async (_req: Request, res: Response): Promise<void> => {
  try {
    const albums = await Album.find({ deleted: false }).sort({ createdAt: -1 }).lean();
    const singers = await Singer.find({ _id: { $in: albums.map(a => a.singerId).filter(validId) } }).select("fullName").lean();
    const singerMap = new Map(singers.map(s => [String(s._id), s.fullName]));
    const countRows = await Song.aggregate([
      { $match: { deleted: false, albumId: { $in: albums.map(a => String(a._id)) } } },
      { $group: { _id: "$albumId", count: { $sum: 1 } } },
    ]);
    const counts = new Map(countRows.map(r => [String(r._id), Number(r.count)]));
    res.render("admin/pages/albums/index", { pageTitle: "Quản lý album", albums,
      singerMap: Object.fromEntries(singerMap), counts: Object.fromEntries(counts) });
  } catch (err) { onError(res, err); }
};
export const create = async (_req: Request, res: Response): Promise<void> => {
  const singers = await Singer.find({ deleted: false, status: "active" }).select("fullName").sort({ fullName: 1 }).lean();
  res.render("admin/pages/albums/form", { pageTitle: "Thêm album", album: null, singers,
    action: `${base}/create` });
};
export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fields(req);
    const avatar = image(req.body?.avatar);
    await Album.create({ ...data, ...(avatar ? { avatar } : {}) });
    res.redirect(base);
  } catch (err) { onError(res, err); }
};
export const edit = async (req: Request, res: Response): Promise<void> => {
  if (!validId(req.params.id)) { res.status(404).send("Không tìm thấy album."); return; }
  const album = await Album.findOne({ _id: req.params.id, deleted: false }).lean();
  if (!album) { res.status(404).send("Không tìm thấy album."); return; }
  const singers = await Singer.find({ deleted: false }).select("fullName").sort({ fullName: 1 }).lean();
  res.render("admin/pages/albums/form", { pageTitle: "Chỉnh sửa album", album, singers,
    action: `${base}/edit/${album._id}?_method=PATCH` });
};
export const editPatch = async (req: Request, res: Response): Promise<void> => {
  if (!validId(req.params.id)) { res.status(404).send("Không tìm thấy album."); return; }
  try {
    const album = await Album.findOne({ _id: req.params.id, deleted: false });
    if (!album) { res.status(404).send("Không tìm thấy album."); return; }
    const data = await fields(req);
    Object.assign(album, data);
    const avatar = image(req.body?.avatar);
    if (avatar) album.avatar = avatar;
    await album.save();
    res.redirect(base);
  } catch (err) { onError(res, err); }
};
export const deleteOne = async (req: Request, res: Response): Promise<void> => {
  if (!validId(req.params.id)) { res.status(404).send("Không tìm thấy album."); return; }
  try {
    const count = await Song.countDocuments({ albumId: req.params.id, deleted: false });
    if (count) { res.status(409).send("Album đang có bài hát. Hãy bỏ liên kết album ở các bài hát trước khi xóa."); return; }
    await Album.updateOne({ _id: req.params.id, deleted: false }, { $set: { deleted: true, deletedAt: new Date() } });
    res.redirect(base);
  } catch (err) { onError(res, err); }
};
