import { Request, Response } from "express";
import mongoose from "mongoose";
import Singer from "../../models/singer.model";
import SingerFollow from "../../models/singer-follow.model";

const isValidId = (id: string): boolean => mongoose.isValidObjectId(id);

// GET /api/follows/singers/:singerId/status - trạng thái theo tài khoản đăng nhập.
export const status = async (req: Request, res: Response): Promise<void> => {
  const singerId = String(req.params.singerId);
  if (!isValidId(singerId)) {
    res.status(400).json({ code: "INVALID_SINGER", message: "singerId không hợp lệ" });
    return;
  }
  try {
    const singer = await Singer.exists({ _id: singerId, deleted: false, status: "active" });
    if (!singer) {
      res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy nghệ sĩ" });
      return;
    }
    const userId = res.locals.authUserId as string;
    const exists = await SingerFollow.exists({ userId, singerId });
    res.json({ code: 200, following: Boolean(exists) });
  } catch (error) {
    console.error("[follows/status]", error);
    res.status(500).json({ code: 500, message: "Không thể tải trạng thái theo dõi" });
  }
};

// PUT: idempotent, userId luôn lấy từ Redis Session, không nhận từ client.
export const follow = async (req: Request, res: Response): Promise<void> => {
  const singerId = String(req.params.singerId);
  if (!isValidId(singerId)) {
    res.status(400).json({ code: "INVALID_SINGER", message: "singerId không hợp lệ" });
    return;
  }
  try {
    const singer = await Singer.exists({ _id: singerId, deleted: false, status: "active" });
    if (!singer) {
      res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy nghệ sĩ" });
      return;
    }
    const userId = res.locals.authUserId as string;
    await SingerFollow.updateOne(
      { userId, singerId },
      { $setOnInsert: { userId, singerId } },
      { upsert: true }
    );
    res.json({ code: 200, message: "Đã theo dõi nghệ sĩ", following: true });
  } catch (error: unknown) {
    // Cùng lúc gửi nhiều PUT: unique index bảo đảm chỉ một quan hệ.
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      res.json({ code: 200, message: "Đã theo dõi nghệ sĩ", following: true });
      return;
    }
    console.error("[follows/follow]", error);
    res.status(500).json({ code: 500, message: "Không thể theo dõi nghệ sĩ" });
  }
};

// DELETE: chỉ xóa quan hệ (userId, singerId) của người đang đăng nhập.
export const unfollow = async (req: Request, res: Response): Promise<void> => {
  const singerId = String(req.params.singerId);
  if (!isValidId(singerId)) {
    res.status(400).json({ code: "INVALID_SINGER", message: "singerId không hợp lệ" });
    return;
  }
  try {
    const userId = res.locals.authUserId as string;
    await SingerFollow.deleteOne({ userId, singerId });
    res.json({ code: 200, message: "Đã bỏ theo dõi nghệ sĩ", following: false });
  } catch (error) {
    console.error("[follows/unfollow]", error);
    res.status(500).json({ code: 500, message: "Không thể bỏ theo dõi nghệ sĩ" });
  }
};

// GET /api/follows/me?page=1&limit=20 - chỉ danh sách của người đang đăng nhập.
export const myFollowing = async (req: Request, res: Response): Promise<void> => {
  const rawPage = Number(req.query.page);
  const rawLimit = Number(req.query.limit);
  const page = Number.isInteger(rawPage) ? Math.min(1000, Math.max(1, rawPage)) : 1;
  const limit = Number.isInteger(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 20;
  try {
    const userId = res.locals.authUserId as string;
    const [items, total] = await Promise.all([
      SingerFollow.find({ userId })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SingerFollow.countDocuments({ userId }),
    ]);
    const singerIds = items.map((entry) => entry.singerId).filter(isValidId);
    const singers = await Singer.find({
      _id: { $in: singerIds }, deleted: false, status: "active",
    }).select("_id fullName slug avatar").lean();
    const singerMap = new Map(singers.map((item) => [String(item._id), item]));
    const data = items.flatMap((entry) => {
      const singer = singerMap.get(entry.singerId);
      if (!singer) return [];
      return [{
        singerId: entry.singerId,
        fullName: singer.fullName || "Nghệ sĩ",
        slug: singer.slug || "",
        avatar: singer.avatar || "",
        followedAt: entry.createdAt,
      }];
    });
    res.json({
      code: 200, data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[follows/me]", error);
    res.status(500).json({ code: 500, message: "Không thể tải danh sách nghệ sĩ" });
  }
};
