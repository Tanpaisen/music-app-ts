import { Request, Response } from "express";
import mongoose from "mongoose";
import Song from "../../models/song.model";
import SongComment from "../../models/song-comment.model";
import User from "../../models/user.model";

type CommentBody = { content?: unknown };

const getContent = (body: CommentBody | undefined): string | null => {
  if (typeof body?.content !== "string") return null;
  const text = body.content.trim();
  return text.length >= 1 && text.length <= 1000 ? text : null;
};

const validId = (id: string) => mongoose.isValidObjectId(id);

const serialize = (
  item: { _id: unknown; songId: string; userId: string; content: string; createdAt?: Date; updatedAt?: Date },
  authorName: string,
  currentUserId?: string
) => ({
  id: String(item._id),
  songId: item.songId,
  content: item.content,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  author: { id: item.userId, fullName: authorName },
  isMine: Boolean(currentUserId && currentUserId === item.userId),
});

const songExists = (songId: string) =>
  Song.exists({ _id: songId, deleted: false, status: "active" });

// Công khai: xem bình luận của một bài hát, mới nhất trước, tối đa 20 mỗi trang.
export const list = async (req: Request, res: Response): Promise<void> => {
  const songId = String(req.params.songId);
  if (!validId(songId)) {
    res.status(400).json({ code: "INVALID_SONG", message: "songId không hợp lệ" });
    return;
  }
  const rawPage = Number(req.query.page);
  const rawLimit = Number(req.query.limit);
  const page = Number.isInteger(rawPage) ? Math.max(1, Math.min(1000, rawPage)) : 1;
  const limit = Number.isInteger(rawLimit) ? Math.max(1, Math.min(20, rawLimit)) : 10;
  try {
    if (!(await songExists(songId))) {
      res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy bài hát" });
      return;
    }

    const [items, total] = await Promise.all([
      SongComment.find({ songId })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SongComment.countDocuments({ songId }),
    ]);

    const userIds = [...new Set(items.map((item) => item.userId))].filter(validId);
    const users = await User.find({ _id: { $in: userIds } }).select("_id fullName").lean();
    const names = new Map(users.map((user) => [String(user._id), user.fullName]));
    const currentUserId = req.session?.clientUserId;
    res.json({
      code: 200,
      data: items.map((item) => serialize(item, names.get(item.userId) || "Người dùng", currentUserId)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[comments/list]", error);
    res.status(500).json({ code: 500, message: "Không thể tải bình luận" });
  }
};

// Công khai: lấy tổng bình luận để hiển thị trên nút Comment.
export const count = async (req: Request, res: Response): Promise<void> => {
  const songId = String(req.params.songId);
  if (!validId(songId)) {
    res.status(400).json({ code: "INVALID_SONG", message: "songId không hợp lệ" });
    return;
  }
  try {
    if (!(await songExists(songId))) {
      res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy bài hát" });
      return;
    }
    res.json({ code: 200, count: await SongComment.countDocuments({ songId }) });
  } catch (error) {
    console.error("[comments/count]", error);
    res.status(500).json({ code: 500, message: "Không thể lấy số bình luận" });
  }
};

// Riêng người đã đăng nhập: tạo bình luận theo userId từ session.
export const create = async (req: Request, res: Response): Promise<void> => {
  const songId = String(req.params.songId);
  const content = getContent(req.body as CommentBody | undefined);
  if (!validId(songId) || content === null) {
    res.status(400).json({ code: "INVALID_INPUT", message: "Bình luận phải có từ 1 đến 1000 ký tự" });
    return;
  }
  try {
    if (!(await songExists(songId))) {
      res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy bài hát" });
      return;
    }
    const userId = res.locals.authUserId as string;
    const user = res.locals.authUser as { fullName?: string };
    const item = await SongComment.create({ songId, userId, content });
    res.status(201).json({ code: 201, data: serialize(item, user.fullName || "Người dùng", userId) });
  } catch (error) {
    console.error("[comments/create]", error);
    res.status(500).json({ code: 500, message: "Không thể gửi bình luận" });
  }
};

// Chỉ chủ bình luận có quyền sửa (người khác nhận 404 để không lộ dữ liệu).
export const update = async (req: Request, res: Response): Promise<void> => {
  const commentId = String(req.params.commentId);
  const content = getContent(req.body as CommentBody | undefined);
  if (!validId(commentId) || content === null) {
    res.status(400).json({ code: "INVALID_INPUT", message: "Bình luận phải có từ 1 đến 1000 ký tự" });
    return;
  }
  try {
    const userId = res.locals.authUserId as string;
    const user = res.locals.authUser as { fullName?: string };
    const item = await SongComment.findOneAndUpdate(
      { _id: commentId, userId },
      { $set: { content } },
      { returnDocument: "after", runValidators: true }
    );
    if (!item) {
      res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy bình luận của bạn" });
      return;
    }
    res.json({ code: 200, data: serialize(item, user.fullName || "Người dùng", userId) });
  } catch (error) {
    console.error("[comments/update]", error);
    res.status(500).json({ code: 500, message: "Không thể sửa bình luận" });
  }
};

// Chỉ chủ bình luận có quyền xóa.
export const remove = async (req: Request, res: Response): Promise<void> => {
  const commentId = String(req.params.commentId);
  if (!validId(commentId)) {
    res.status(400).json({ code: "INVALID_ID", message: "commentId không hợp lệ" });
    return;
  }
  try {
    const userId = res.locals.authUserId as string;
    const deleted = await SongComment.deleteOne({ _id: commentId, userId });
    if (deleted.deletedCount === 0) {
      res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy bình luận của bạn" });
      return;
    }
    res.json({ code: 200, message: "Đã xóa bình luận" });
  } catch (error) {
    console.error("[comments/remove]", error);
    res.status(500).json({ code: 500, message: "Không thể xóa bình luận" });
  }
};
