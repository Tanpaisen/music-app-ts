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
exports.listenPatch = exports.favorite = exports.favoriteState = exports.favoritePatch = exports.like = exports.likeState = exports.detail = exports.list = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const song_model_1 = __importDefault(require("../../models/song.model"));
const topic_model_1 = __importDefault(require("../../models/topic.model"));
const singer_model_1 = __importDefault(require("../../models/singer.model"));
const favorite_song_model_1 = __importDefault(require("../../models/favorite.song.model"));
const song_like_model_1 = __importDefault(require("../../models/song-like.model"));
const song_service_1 = require("../../services/song.service");
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const topic = yield topic_model_1.default.findOne({ slug: req.params.songSlug, deleted: false });
        if (!topic) {
            res.status(404).json({ message: "Không tìm thấy chủ đề" });
            return;
        }
        const songs = yield song_model_1.default.find({ topicId: String(topic._id), deleted: false }).lean();
        const populated = yield Promise.all(songs.map((song) => __awaiter(void 0, void 0, void 0, function* () {
            const singer = song.singerId && mongoose_1.default.isValidObjectId(song.singerId)
                ? yield singer_model_1.default.findById(song.singerId).select("fullName").lean()
                : null;
            return Object.assign(Object.assign({}, song), { singer });
        })));
        res.render("client/pages/songs/list", { pageTitle: "Danh sách bài hát", topic, songs: populated });
    }
    catch (error) {
        console.error("[songs/list]", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
});
exports.list = list;
const detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield song_service_1.songService.getSongDetail(String(req.params.songSlug));
        if (!data) {
            res.status(404).json({ code: 404, message: "Không tìm thấy bài hát" });
            return;
        }
        res.json({ code: 200, message: "Thành công", data });
    }
    catch (error) {
        console.error("[songs/detail]", error);
        res.status(500).json({ code: 500, message: "Lỗi máy chủ" });
    }
});
exports.detail = detail;
const likeState = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = res.locals.authUserId;
    const songId = req.params.songId;
    if (!mongoose_1.default.isValidObjectId(songId)) {
        res.status(400).json({ message: "songId không hợp lệ" });
        return;
    }
    try {
        const [liked, song] = yield Promise.all([
            song_like_model_1.default.exists({ userId, songId }),
            song_model_1.default.findOne({ _id: songId, deleted: false, status: "active" }).select("like"),
        ]);
        if (!song) {
            res.status(404).json({ message: "Không tìm thấy bài hát" });
            return;
        }
        res.json({ code: 200, liked: Boolean(liked), like: (_a = song.like) !== null && _a !== void 0 ? _a : 0 });
    }
    catch (error) {
        console.error("[songs/likeState]", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
});
exports.likeState = likeState;
const like = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { songId, status } = req.params;
    const userId = res.locals.authUserId;
    if (!mongoose_1.default.isValidObjectId(songId) || !["like", "unlike"].includes(String(status))) {
        res.status(400).json({ message: "songId hoặc status không hợp lệ" });
        return;
    }
    try {
        const song = yield song_model_1.default.findOne({ _id: songId, deleted: false, status: "active" }).select("_id");
        if (!song) {
            res.status(404).json({ message: "Không tìm thấy bài hát" });
            return;
        }
        const session = yield mongoose_1.default.startSession();
        let count = 0;
        try {
            yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
                if (status === "like") {
                    yield song_like_model_1.default.updateOne({ userId, songId }, { $setOnInsert: { userId, songId } }, { upsert: true, session });
                }
                else {
                    yield song_like_model_1.default.deleteOne({ userId, songId }).session(session);
                }
                count = yield song_like_model_1.default.countDocuments({ songId }).session(session);
                const result = yield song_model_1.default.updateOne({ _id: songId, deleted: false, status: "active" }, { $set: { like: count } }, { session });
                if (result.matchedCount !== 1)
                    throw new Error("Song no longer available");
            }));
        }
        finally {
            yield session.endSession();
        }
        res.json({ code: 200, message: "Thành công", liked: status === "like", like: count });
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000 && status === "like") {
            const count = yield song_like_model_1.default.countDocuments({ songId });
            res.json({ code: 200, message: "Đã thích bài hát", liked: true, like: count });
            return;
        }
        console.error("[songs/like]", error);
        res.status(500).json({ message: "Không thể cập nhật lượt thích" });
    }
});
exports.like = like;
const favoritePatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { songId, status } = req.params;
    const userId = res.locals.authUserId;
    if (!mongoose_1.default.isValidObjectId(songId) || !["favorite", "unfavorite"].includes(String(status))) {
        res.status(400).json({ message: "songId hoặc status không hợp lệ" });
        return;
    }
    try {
        if (status === "favorite") {
            const exists = yield song_model_1.default.exists({ _id: songId, deleted: false, status: "active" });
            if (!exists) {
                res.status(404).json({ message: "Không tìm thấy bài hát" });
                return;
            }
            yield favorite_song_model_1.default.updateOne({ userId, songId }, { $set: { deleted: false, deletedAt: null }, $setOnInsert: { userId, songId } }, { upsert: true });
        }
        else {
            yield favorite_song_model_1.default.updateOne({ userId, songId, deleted: false }, { $set: { deleted: true, deletedAt: new Date() } });
        }
        res.json({ code: 200, message: status === "favorite" ? "Đã thêm vào yêu thích" : "Đã xóa yêu thích" });
    }
    catch (error) {
        console.error("[songs/favoritePatch]", error);
        res.status(500).json({ message: "Không thể cập nhật bài hát yêu thích" });
    }
});
exports.favoritePatch = favoritePatch;
const favoriteState = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = res.locals.authUserId;
    const songId = req.params.songId;
    if (!mongoose_1.default.isValidObjectId(songId)) {
        res.status(400).json({ message: "songId không hợp lệ" });
        return;
    }
    try {
        const found = yield favorite_song_model_1.default.exists({ userId, songId, deleted: false });
        res.json({ code: 200, favorite: Boolean(found) });
    }
    catch (error) {
        console.error("[songs/favoriteState]", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
});
exports.favoriteState = favoriteState;
const favorite = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = res.locals.authUserId;
    try {
        const favorites = yield favorite_song_model_1.default.find({ userId, deleted: false })
            .sort({ createdAt: -1 }).lean();
        const data = yield Promise.all(favorites.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const song = yield song_model_1.default.findOne({ _id: item.songId, deleted: false, status: "active" }).lean();
            if (!song)
                return null;
            const singer = song.singerId && mongoose_1.default.isValidObjectId(song.singerId)
                ? yield singer_model_1.default.findById(song.singerId).select("fullName slug").lean()
                : null;
            return { id: String(item._id), song, singer };
        })));
        res.json({ code: 200, data: data.filter(Boolean) });
    }
    catch (error) {
        console.error("[songs/favorite]", error);
        res.status(500).json({ message: "Không thể lấy bài hát yêu thích" });
    }
});
exports.favorite = favorite;
const listenPatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const song = yield song_model_1.default.findOneAndUpdate({ slug: req.params.songSlug, deleted: false, status: "active" }, { $inc: { listen: 1 } }, { returnDocument: "after" });
        if (!song) {
            res.status(404).json({ code: 404, message: "Không tìm thấy bài hát" });
            return;
        }
        res.json({ code: 200, message: "Đã ghi nhận lượt nghe", listen: song.listen });
    }
    catch (error) {
        console.error("[songs/listen]", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
});
exports.listenPatch = listenPatch;
