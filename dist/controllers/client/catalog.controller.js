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
exports.liked = exports.topicDetail = exports.topics = exports.artists = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const singer_model_1 = __importDefault(require("../../models/singer.model"));
const topic_model_1 = __importDefault(require("../../models/topic.model"));
const song_model_1 = __importDefault(require("../../models/song.model"));
const song_like_model_1 = __importDefault(require("../../models/song-like.model"));
function pageOptions(req) {
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);
    const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 100000) : 1;
    const limit = Number.isSafeInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 36) : 12;
    return { page, limit, skip: (page - 1) * limit };
}
function safeQuery(req) {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
    return q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const artists = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit, skip } = pageOptions(req);
        const q = safeQuery(req);
        const filter = Object.assign({ deleted: false, status: "active" }, (q ? { fullName: { $regex: q, $options: "i" } } : {}));
        const [data, total] = yield Promise.all([
            singer_model_1.default.find(filter).select("fullName avatar slug").sort({ fullName: 1, _id: 1 }).skip(skip).limit(limit).lean(),
            singer_model_1.default.countDocuments(filter),
        ]);
        res.setHeader("Cache-Control", "no-store");
        res.json({ code: 200, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (error) {
        console.error("[catalog/artists]", error);
        res.status(500).json({ message: "Không thể tải danh sách ca sĩ" });
    }
});
exports.artists = artists;
const topics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit, skip } = pageOptions(req);
        const q = safeQuery(req);
        const filter = Object.assign({ deleted: false, status: "active" }, (q ? { title: { $regex: q, $options: "i" } } : {}));
        const [data, total] = yield Promise.all([
            topic_model_1.default.find(filter).select("title description slug avatar").sort({ title: 1, _id: 1 }).skip(skip).limit(limit).lean(),
            topic_model_1.default.countDocuments(filter),
        ]);
        res.setHeader("Cache-Control", "no-store");
        res.json({ code: 200, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (error) {
        console.error("[catalog/topics]", error);
        res.status(500).json({ message: "Không thể tải danh sách chủ đề" });
    }
});
exports.topics = topics;
const topicDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit, skip } = pageOptions(req);
        const key = req.params.topicSlug;
        const identity = mongoose_1.default.isValidObjectId(key) ? { $or: [{ slug: key }, { _id: key }] } : { slug: key };
        const topic = yield topic_model_1.default.findOne(Object.assign(Object.assign({}, identity), { deleted: false, status: "active" }))
            .select("title slug description avatar").lean();
        if (!topic) {
            res.status(404).json({ message: "Không tìm thấy chủ đề" });
            return;
        }
        const filter = { topicId: String(topic._id), deleted: false, status: "active" };
        const [songs, total] = yield Promise.all([
            song_model_1.default.find(filter).select("title slug avatar singerId listen like").sort({ listen: -1, _id: -1 }).skip(skip).limit(limit).lean(),
            song_model_1.default.countDocuments(filter),
        ]);
        const singerIds = [...new Set(songs.map(song => { var _a; return String((_a = song.singerId) !== null && _a !== void 0 ? _a : ""); }).filter(id => mongoose_1.default.isValidObjectId(id)))];
        const singers = yield singer_model_1.default.find({ _id: { $in: singerIds }, deleted: false }).select("fullName slug").lean();
        const singerMap = new Map(singers.map(s => [String(s._id), { fullName: s.fullName, slug: s.slug }]));
        const data = songs.map(song => { var _a, _b, _c; return ({
            _id: song._id, title: song.title, slug: song.slug, avatar: song.avatar,
            listen: (_a = song.listen) !== null && _a !== void 0 ? _a : 0, like: (_b = song.like) !== null && _b !== void 0 ? _b : 0,
            singer: (_c = singerMap.get(String(song.singerId))) !== null && _c !== void 0 ? _c : null,
        }); });
        res.setHeader("Cache-Control", "no-store");
        res.json({ code: 200, data: { topic, songs: data }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (error) {
        console.error("[catalog/topicDetail]", error);
        res.status(500).json({ message: "Không thể tải bài hát của chủ đề" });
    }
});
exports.topicDetail = topicDetail;
const liked = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = res.locals.authUserId;
        const likedSongs = yield song_like_model_1.default.find({ userId }).sort({ createdAt: -1 }).select("songId").lean();
        const songIds = likedSongs.map(item => item.songId);
        const songs = yield song_model_1.default.find({ _id: { $in: songIds }, deleted: false, status: "active" })
            .select("title slug avatar singerId listen like").lean();
        const songMap = new Map(songs.map(song => [String(song._id), song]));
        const singerIds = [...new Set(songs.map(song => { var _a; return String((_a = song.singerId) !== null && _a !== void 0 ? _a : ""); }).filter(id => mongoose_1.default.isValidObjectId(id)))];
        const singers = yield singer_model_1.default.find({ _id: { $in: singerIds }, deleted: false }).select("fullName slug").lean();
        const singerMap = new Map(singers.map(s => [String(s._id), { fullName: s.fullName, slug: s.slug }]));
        const data = songIds.map(id => songMap.get(id)).filter((song) => Boolean(song))
            .map(song => { var _a, _b, _c; return ({
            _id: song._id, title: song.title, slug: song.slug, avatar: song.avatar,
            listen: (_a = song.listen) !== null && _a !== void 0 ? _a : 0, like: (_b = song.like) !== null && _b !== void 0 ? _b : 0,
            singer: (_c = singerMap.get(String(song.singerId))) !== null && _c !== void 0 ? _c : null,
        }); });
        res.setHeader("Cache-Control", "no-store");
        res.json({ code: 200, data });
    }
    catch (error) {
        console.error("[catalog/liked]", error);
        res.status(500).json({ message: "Không thể tải các bài hát đã thích" });
    }
});
exports.liked = liked;
