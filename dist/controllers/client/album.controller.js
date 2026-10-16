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
exports.detail = exports.index = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const album_model_1 = __importDefault(require("../../models/album.model"));
const singer_model_1 = __importDefault(require("../../models/singer.model"));
const song_model_1 = __importDefault(require("../../models/song.model"));
const VISIBLE = { deleted: false, status: "active" };
function paging(req) {
    const n = Number(req.query.page);
    const l = Number(req.query.limit);
    const page = Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 1;
    const limit = Number.isSafeInteger(l) && l > 0 ? Math.min(l, 50) : 12;
    return { page, limit, skip: (page - 1) * limit };
}
function singersFor(ids) {
    return __awaiter(this, void 0, void 0, function* () {
        const unique = [...new Set(ids)].filter(mongoose_1.default.isValidObjectId);
        const singers = yield singer_model_1.default.find({ _id: { $in: unique }, deleted: false })
            .select("fullName slug avatar").lean();
        return new Map(singers.map(s => { var _a, _b, _c; return [String(s._id),
            { _id: String(s._id), fullName: (_a = s.fullName) !== null && _a !== void 0 ? _a : "", slug: (_b = s.slug) !== null && _b !== void 0 ? _b : "", avatar: (_c = s.avatar) !== null && _c !== void 0 ? _c : "" }]; }));
    });
}
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit, skip } = paging(req);
        const [albums, total] = yield Promise.all([
            album_model_1.default.find(VISIBLE).select("title slug avatar description singerId releaseDate")
                .sort({ releaseDate: -1, createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
            album_model_1.default.countDocuments(VISIBLE),
        ]);
        const singers = yield singersFor(albums.map(a => String(a.singerId || "")));
        const counts = yield song_model_1.default.aggregate([
            { $match: { deleted: false, status: "active", albumId: { $in: albums.map(a => String(a._id)) } } },
            { $group: { _id: "$albumId", count: { $sum: 1 } } },
        ]);
        const songCounts = new Map(counts.map(row => [String(row._id), Number(row.count)]));
        res.setHeader("Cache-Control", "no-store");
        res.json({ code: 200, data: albums.map(a => ({ _id: String(a._id), title: a.title,
                slug: a.slug || "", avatar: a.avatar || "", description: a.description || "",
                releaseDate: a.releaseDate || null, singer: singers.get(String(a.singerId)) || null,
                songCount: songCounts.get(String(a._id)) || 0,
            })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (err) {
        console.error("[albums/index]", err);
        res.status(500).json({ message: "Không tải được album" });
    }
});
exports.index = index;
const detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = String(req.params.albumSlug || "");
        const identity = mongoose_1.default.isValidObjectId(key) ? { $or: [{ slug: key }, { _id: key }] } : { slug: key };
        const album = yield album_model_1.default.findOne(Object.assign(Object.assign({}, identity), VISIBLE))
            .select("title slug avatar description singerId releaseDate").lean();
        if (!album) {
            res.status(404).json({ code: 404, message: "Không tìm thấy album" });
            return;
        }
        const { page, limit, skip } = paging(req);
        const filter = { albumId: String(album._id), deleted: false, status: "active" };
        const [songs, total] = yield Promise.all([
            song_model_1.default.find(filter).select("title slug avatar singerId listen like audio")
                .sort({ trackNumber: 1, createdAt: 1, _id: 1 }).skip(skip).limit(limit).lean(),
            song_model_1.default.countDocuments(filter),
        ]);
        const singerMap = yield singersFor([String(album.singerId || ""), ...songs.map(s => String(s.singerId || ""))]);
        res.setHeader("Cache-Control", "no-store");
        res.json({ code: 200, data: { album: {
                    _id: String(album._id), title: album.title, slug: album.slug || "", avatar: album.avatar || "",
                    description: album.description || "", releaseDate: album.releaseDate || null,
                    singer: singerMap.get(String(album.singerId)) || null,
                }, songs: songs.map(s => { var _a, _b; return ({
                    _id: String(s._id), title: s.title || "", slug: s.slug || "", avatar: s.avatar || "",
                    listen: (_a = s.listen) !== null && _a !== void 0 ? _a : 0, like: (_b = s.like) !== null && _b !== void 0 ? _b : 0, audio: s.audio || null,
                    singer: singerMap.get(String(s.singerId)) || null,
                }); }) }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (err) {
        console.error("[albums/detail]", err);
        res.status(500).json({ message: "Không tải được album" });
    }
});
exports.detail = detail;
