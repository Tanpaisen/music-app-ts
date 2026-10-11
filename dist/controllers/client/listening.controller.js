"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.next = exports.myTop = exports.complete = exports.start = void 0;
const node_crypto_1 = require("node:crypto");
const mongoose_1 = __importDefault(require("mongoose"));
const song_model_1 = __importDefault(require("../../models/song.model"));
const singer_model_1 = __importDefault(require("../../models/singer.model"));
const song_play_session_model_1 = __importDefault(require("../../models/song-play-session.model"));
const user_song_listen_model_1 = __importDefault(require("../../models/user-song-listen.model"));
const VALID_SONG = { deleted: false, status: "active" };
const MIN_SECONDS = 30;
function sessionUser(req) {
    var _a;
    const id = (_a = req.session) === null || _a === void 0 ? void 0 : _a.clientUserId;
    return id && mongoose_1.default.isValidObjectId(id) ? id : null;
}
const start = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const songId = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.songId) || "");
    if (!mongoose_1.default.isValidObjectId(songId)) {
        res.status(400).json({ code: "INVALID_SONG", message: "songId không hợp lệ" });
        return;
    }
    try {
        if (!(yield song_model_1.default.exists(Object.assign(Object.assign({ _id: songId }, VALID_SONG), { audio: { $type: "string", $ne: "" } })))) {
            res.status(404).json({ code: "NOT_FOUND", message: "Bài hát không phát được" });
            return;
        }
        const playId = (0, node_crypto_1.randomUUID)();
        yield song_play_session_model_1.default.create({ playId, songId, userId: sessionUser(req), startedAt: new Date() });
        res.status(201).json({ code: 201, playId, requiredSeconds: MIN_SECONDS });
    }
    catch (error) {
        console.error("[listening/start]", error);
        res.status(500).json({ code: "SERVER_ERROR", message: "Không thể khởi tạo phiên nghe" });
    }
});
exports.start = start;
const complete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const playId = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.playId) || "");
    if (!/^[\da-f-]{36}$/i.test(playId)) {
        res.status(400).json({ code: "INVALID_PLAY", message: "playId không hợp lệ" });
        return;
    }
    const userId = sessionUser(req);
    const now = new Date();
    const cutoff = new Date(now.getTime() - MIN_SECONDS * 1000);
    try {
        const existing = yield song_play_session_model_1.default.findOne({ playId }).lean();
        if (!existing) {
            res.status(404).json({ code: "NOT_FOUND", message: "Phiên phát không tồn tại" });
            return;
        }
        if ((existing.userId || null) !== userId) {
            res.status(403).json({ code: "FORBIDDEN", message: "Phiên phát không thuộc tài khoản hiện tại" });
            return;
        }
        if (existing.completedAt) {
            res.json({ code: 200, counted: false, message: "Phiên phát đã được tính" });
            return;
        }
        if (new Date(existing.startedAt).getTime() > cutoff.getTime()) {
            res.status(425).json({ code: "TOO_EARLY", message: "Chưa đủ 30 giây", retryAfterMs: Math.max(1000, new Date(existing.startedAt).getTime() - cutoff.getTime() + 200) });
            return;
        }
        const tx = yield mongoose_1.default.startSession();
        let counted = false;
        let total = 0;
        try {
            yield tx.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                const updated = yield song_play_session_model_1.default.findOne({
                    playId,
                    completedAt: null,
                    startedAt: { $lte: cutoff },
                }).session(tx);
                if (!updated)
                    return;
                updated.completedAt = now;
                yield updated.save({ session: tx });
                const changed = yield song_model_1.default.updateOne(Object.assign({ _id: updated.songId }, VALID_SONG), { $inc: { listen: 1 } }, { session: tx });
                if (changed.matchedCount !== 1) {
                    throw new Error("Song was removed during playback");
                }
                const song = yield song_model_1.default.findById(updated.songId)
                    .select("listen")
                    .session(tx);
                if (!song)
                    throw new Error("Song not found after update");
                if (updated.userId) {
                    yield user_song_listen_model_1.default.updateOne({ userId: updated.userId, songId: updated.songId }, {
                        $inc: { listenCount: 1 },
                        $set: { lastListenedAt: now },
                        $setOnInsert: { userId: updated.userId, songId: updated.songId },
                    }, { upsert: true, session: tx });
                }
                total = (_a = song.listen) !== null && _a !== void 0 ? _a : 0;
                counted = true;
            }));
        }
        finally {
            yield tx.endSession();
        }
        res.json({ code: 200, counted, listen: counted ? total : undefined });
    }
    catch (error) {
        console.error("[listening/complete]", error);
        res.status(500).json({ code: "SERVER_ERROR", message: "Không thể ghi nhận lượt nghe" });
    }
});
exports.complete = complete;
const myTop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = sessionUser(req);
    if (!userId) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" });
        return;
    }
    try {
        const stats = yield user_song_listen_model_1.default.find({ userId }).sort({ listenCount: -1, lastListenedAt: -1 }).limit(30).lean();
        const songs = yield song_model_1.default.find(Object.assign({ _id: { $in: stats.map(s => s.songId) } }, VALID_SONG)).select("_id title slug avatar singerId topicId").lean();
        const byId = new Map(songs.map(s => [String(s._id), s]));
        res.json({ code: 200, data: stats.map(s => ({
                song: byId.get(s.songId) || null,
                listenCount: s.listenCount,
                lastListenedAt: s.lastListenedAt,
            })).filter(s => s.song) });
    }
    catch (error) {
        console.error("[listening/me/top]", error);
        res.status(500).json({ code: "SERVER_ERROR", message: "Không thể tải lịch sử nghe" });
    }
});
exports.myTop = myTop;
function bump(map, id, value) {
    if (id)
        map.set(id, (map.get(id) || 0) + value);
}
const next = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requested = String(req.query.currentSongId || "");
    const currentSongId = mongoose_1.default.isValidObjectId(requested) ? requested : null;
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 12));
    const userId = sessionUser(req);
    try {
        const [history, current] = yield Promise.all([
            userId ? user_song_listen_model_1.default.find({ userId }).sort({ listenCount: -1, lastListenedAt: -1 }).limit(25).lean() : Promise.resolve([]),
            currentSongId ? song_model_1.default.findOne(Object.assign({ _id: currentSongId }, VALID_SONG)).select("singerId topicId").lean() : Promise.resolve(null),
        ]);
        const ids = history.map(s => s.songId);
        const listened = ids.length ? yield song_model_1.default.find(Object.assign({ _id: { $in: ids } }, VALID_SONG)).select("_id singerId topicId").lean() : [];
        const byId = new Map(listened.map(s => [String(s._id), s]));
        const singerWeights = new Map();
        const topicWeights = new Map();
        if (current) {
            bump(singerWeights, String(current.singerId || ""), 6);
            bump(topicWeights, String(current.topicId || ""), 5);
        }
        for (const row of history) {
            const song = byId.get(row.songId);
            if (!song)
                continue;
            const weight = Math.min(12, Number(row.listenCount) || 1);
            bump(singerWeights, String(song.singerId || ""), weight * 3);
            bump(topicWeights, String(song.topicId || ""), weight * 2);
        }
        const query = Object.assign(Object.assign({}, VALID_SONG), { audio: { $type: "string", $ne: "" } });
        if (currentSongId)
            query._id = { $ne: currentSongId };
        const relevant = [
            ...[...singerWeights.keys()].map(singerId => ({ singerId })),
            ...[...topicWeights.keys()].map(topicId => ({ topicId })),
        ];
        const [relatedSongs, popularSongs] = yield Promise.all([
            relevant.length
                ? song_model_1.default.find(Object.assign(Object.assign({}, query), { $or: relevant }))
                    .select("_id title slug avatar audio singerId topicId listen like")
                    .sort({ listen: -1 }).limit(180).lean()
                : Promise.resolve([]),
            song_model_1.default.find(query).select("_id title slug avatar audio singerId topicId listen like")
                .sort({ listen: -1, _id: -1 }).limit(80).lean(),
        ]);
        const unique = new Map();
        for (const song of [...relatedSongs, ...popularSongs])
            unique.set(String(song._id), song);
        const candidates = [...unique.values()];
        const ranked = candidates.map(s => {
            var _a;
            const singerWeight = singerWeights.get(String(s.singerId || "")) || 0;
            const topicWeight = topicWeights.get(String(s.topicId || "")) || 0;
            const alreadyPlayed = history.some(row => row.songId === String(s._id));
            const score = singerWeight + topicWeight + Math.log1p((_a = s.listen) !== null && _a !== void 0 ? _a : 0) * 0.4 - (alreadyPlayed ? 3 : 0);
            return { song: s, score };
        }).sort((a, b) => b.score - a.score).slice(0, limit);
        const singerIds = [...new Set(ranked.map(r => String(r.song.singerId || "")).filter(mongoose_1.default.isValidObjectId))];
        const singers = yield singer_model_1.default.find({ _id: { $in: singerIds } }).select("_id fullName slug").lean();
        const singerMap = new Map(singers.map(s => [String(s._id), s]));
        res.json({ code: 200, personalized: Boolean(userId && history.length), data: ranked.map(({ song }) => {
                const singer = singerMap.get(String(song.singerId));
                return {
                    _id: String(song._id), slug: song.slug || "", title: song.title || "",
                    avatar: song.avatar || "", audio: song.audio || "",
                    singer: singer ? { _id: String(singer._id), fullName: singer.fullName || "", slug: singer.slug || "" } : null,
                };
            }) });
    }
    catch (error) {
        console.error("[listening/next]", error);
        res.status(500).json({ code: "SERVER_ERROR", message: "Không thể tải gợi ý bài hát" });
    }
});
exports.next = next;
