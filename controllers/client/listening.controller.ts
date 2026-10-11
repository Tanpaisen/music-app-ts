import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Song from "../../models/song.model";
import Singer from "../../models/singer.model";
import SongPlaySession from "../../models/song-play-session.model";
import UserSongListen from "../../models/user-song-listen.model";

const VALID_SONG = { deleted: false, status: "active" } as const;
const MIN_SECONDS = 30;

function sessionUser(req: Request): string | null {
  const id = req.session?.clientUserId;
  return id && mongoose.isValidObjectId(id) ? id : null;
}

// POST /api/listening/start { songId }
// Bắt đầu một lần phát ở máy chủ; không tăng lượt nghe tại bước này.
export const start = async (req: Request, res: Response): Promise<void> => {
  const songId = String(req.body?.songId || "");
  if (!mongoose.isValidObjectId(songId)) {
    res.status(400).json({ code: "INVALID_SONG", message: "songId không hợp lệ" }); return;
  }
  try {
    if (!await Song.exists({ _id: songId, ...VALID_SONG, audio: { $type: "string", $ne: "" } })) {
      res.status(404).json({ code: "NOT_FOUND", message: "Bài hát không phát được" }); return;
    }
    const playId = randomUUID();
    await SongPlaySession.create({ playId, songId, userId: sessionUser(req), startedAt: new Date() });
    res.status(201).json({ code: 201, playId, requiredSeconds: MIN_SECONDS });
  } catch (error) {
    console.error("[listening/start]", error);
    res.status(500).json({ code: "SERVER_ERROR", message: "Không thể khởi tạo phiên nghe" });
  }
};

// POST /api/listening/complete { playId }
// Frontend chỉ gửi sau 30s nghe thực; server còn kiểm tra 30s đồng hồ.
// MongoDB Atlas replica set hỗ trợ transaction để tránh lệch số khi request đến đồng thời.
export const complete = async (req: Request, res: Response): Promise<void> => {
  const playId = String(req.body?.playId || "");
  if (!/^[\da-f-]{36}$/i.test(playId)) {
    res.status(400).json({ code: "INVALID_PLAY", message: "playId không hợp lệ" }); return;
  }
  const userId = sessionUser(req);
  const now = new Date();
  const cutoff = new Date(now.getTime() - MIN_SECONDS * 1000);
  try {
    const existing = await SongPlaySession.findOne({ playId }).lean();
    if (!existing) { res.status(404).json({ code: "NOT_FOUND", message: "Phiên phát không tồn tại" }); return; }
    if ((existing.userId || null) !== userId) {
      res.status(403).json({ code: "FORBIDDEN", message: "Phiên phát không thuộc tài khoản hiện tại" }); return;
    }
    if (existing.completedAt) {
      res.json({ code: 200, counted: false, message: "Phiên phát đã được tính" }); return;
    }
    if (new Date(existing.startedAt).getTime() > cutoff.getTime()) {
      res.status(425).json({ code: "TOO_EARLY", message: "Chưa đủ 30 giây", retryAfterMs: Math.max(1000, new Date(existing.startedAt).getTime() - cutoff.getTime() + 200) });
      return;
    }

    const tx = await mongoose.startSession();
    let counted = false;
    let total = 0;
    try {
      await tx.withTransaction(async () => {
        // Lấy và khóa cập nhật phiên phát BÊN TRONG transaction.
        // Không dùng findOneAndUpdate để tránh lỗi overload TS2769
        // ở một số tổ hợp phiên bản Mongoose/TypeScript.
        const updated = await SongPlaySession.findOne({
          playId,
          completedAt: null,
          startedAt: { $lte: cutoff },
        }).session(tx);

        if (!updated) return; // Phiên đã được ghi nhận; không cộng trùng.

        updated.completedAt = now;
        await updated.save({ session: tx });

        // Tăng bộ đếm công khai một cách nguyên tử trong transaction.
        const changed = await Song.updateOne(
          { _id: updated.songId, ...VALID_SONG },
          { $inc: { listen: 1 } },
          { session: tx }
        );
        if (changed.matchedCount !== 1) {
          throw new Error("Song was removed during playback");
        }

        const song = await Song.findById(updated.songId)
          .select("listen")
          .session(tx);
        if (!song) throw new Error("Song not found after update");

        if (updated.userId) {
          await UserSongListen.updateOne(
            { userId: updated.userId, songId: updated.songId },
            {
              $inc: { listenCount: 1 },
              $set: { lastListenedAt: now },
              $setOnInsert: { userId: updated.userId, songId: updated.songId },
            },
            { upsert: true, session: tx }
          );
        }
        total = song.listen ?? 0;
        counted = true;
      });
    } finally {
      await tx.endSession();
    }
    res.json({ code: 200, counted, listen: counted ? total : undefined });
  } catch (error) {
    console.error("[listening/complete]", error);
    res.status(500).json({ code: "SERVER_ERROR", message: "Không thể ghi nhận lượt nghe" });
  }
};

// GET /api/listening/me/top : thống kê riêng, KHÔNG cho phép truyền userId từ client.
export const myTop = async (req: Request, res: Response): Promise<void> => {
  const userId = sessionUser(req);
  if (!userId) { res.status(401).json({ code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" }); return; }
  try {
    const stats = await UserSongListen.find({ userId }).sort({ listenCount: -1, lastListenedAt: -1 }).limit(30).lean();
    const songs = await Song.find({ _id: { $in: stats.map(s => s.songId) }, ...VALID_SONG }).select("_id title slug avatar singerId topicId").lean();
    const byId = new Map(songs.map(s => [String(s._id), s]));
    res.json({ code: 200, data: stats.map(s => ({
      song: byId.get(s.songId) || null,
      listenCount: s.listenCount,
      lastListenedAt: s.lastListenedAt,
    })).filter(s => s.song) });
  } catch (error) {
    console.error("[listening/me/top]", error);
    res.status(500).json({ code: "SERVER_ERROR", message: "Không thể tải lịch sử nghe" });
  }
};

type ScoreRecord = { singerId?: string; topicId?: string; listenCount?: number };
function bump(map: Map<string, number>, id: string | undefined, value: number): void {
  if (id) map.set(id, (map.get(id) || 0) + value);
}

// GET /api/listening/next?currentSongId=<id>&limit=12
// Khách: liên quan đến bài đang nghe + phổ biến; đăng nhập: thêm hồ sơ nghe cá nhân.
export const next = async (req: Request, res: Response): Promise<void> => {
  const requested = String(req.query.currentSongId || "");
  const currentSongId = mongoose.isValidObjectId(requested) ? requested : null;
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 12));
  const userId = sessionUser(req);
  try {
    const [history, current] = await Promise.all([
      userId ? UserSongListen.find({ userId }).sort({ listenCount: -1, lastListenedAt: -1 }).limit(25).lean() : Promise.resolve([]),
      currentSongId ? Song.findOne({ _id: currentSongId, ...VALID_SONG }).select("singerId topicId").lean() : Promise.resolve(null),
    ]);
    const ids = history.map(s => s.songId);
    const listened = ids.length ? await Song.find({ _id: { $in: ids }, ...VALID_SONG }).select("_id singerId topicId").lean() : [];
    const byId = new Map(listened.map(s => [String(s._id), s]));
    const singerWeights = new Map<string, number>();
    const topicWeights = new Map<string, number>();
    if (current) {
      bump(singerWeights, String(current.singerId || ""), 6);
      bump(topicWeights, String(current.topicId || ""), 5);
    }
    for (const row of history) {
      const song = byId.get(row.songId) as ScoreRecord | undefined;
      if (!song) continue;
      const weight = Math.min(12, Number(row.listenCount) || 1);
      bump(singerWeights, String(song.singerId || ""), weight * 3);
      bump(topicWeights, String(song.topicId || ""), weight * 2);
    }
    const query: any = { ...VALID_SONG, audio: { $type: "string", $ne: "" } };
    if (currentSongId) query._id = { $ne: currentSongId };
    // Lấy hai pool: các bài cùng nghệ sĩ/chủ đề và các bài phổ biến (cold start).
    const relevant = [
      ...[...singerWeights.keys()].map(singerId => ({ singerId })),
      ...[...topicWeights.keys()].map(topicId => ({ topicId })),
    ];
    const [relatedSongs, popularSongs] = await Promise.all([
      relevant.length
        ? Song.find({ ...query, $or: relevant })
            .select("_id title slug avatar audio singerId topicId listen like")
            .sort({ listen: -1 }).limit(180).lean()
        : Promise.resolve([]),
      Song.find(query).select("_id title slug avatar audio singerId topicId listen like")
        .sort({ listen: -1, _id: -1 }).limit(80).lean(),
    ]);
    const unique = new Map<string, typeof popularSongs[number]>();
    for (const song of [...relatedSongs, ...popularSongs]) unique.set(String(song._id), song);
    const candidates = [...unique.values()];
    const ranked = candidates.map(s => {
      const singerWeight = singerWeights.get(String(s.singerId || "")) || 0;
      const topicWeight = topicWeights.get(String(s.topicId || "")) || 0;
      const alreadyPlayed = history.some(row => row.songId === String(s._id));
      const score = singerWeight + topicWeight + Math.log1p(s.listen ?? 0) * 0.4 - (alreadyPlayed ? 3 : 0);
      return { song: s, score };
    }).sort((a, b) => b.score - a.score).slice(0, limit);
    const singerIds = [...new Set(ranked.map(r => String(r.song.singerId || "")).filter(mongoose.isValidObjectId))];
    const singers = await Singer.find({ _id: { $in: singerIds } }).select("_id fullName slug").lean();
    const singerMap = new Map(singers.map(s => [String(s._id), s]));
    res.json({ code: 200, personalized: Boolean(userId && history.length), data: ranked.map(({ song }) => {
      const singer = singerMap.get(String(song.singerId));
      return {
        _id: String(song._id), slug: song.slug || "", title: song.title || "",
        avatar: song.avatar || "", audio: song.audio || "",
        singer: singer ? { _id: String(singer._id), fullName: singer.fullName || "", slug: singer.slug || "" } : null,
      };
    }) });
  } catch (error) {
    console.error("[listening/next]", error);
    res.status(500).json({ code: "SERVER_ERROR", message: "Không thể tải gợi ý bài hát" });
  }
};
