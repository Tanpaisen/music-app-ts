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
exports.detail = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const singer_model_1 = __importDefault(require("../../models/singer.model"));
const song_model_1 = __importDefault(require("../../models/song.model"));
const singer_follow_model_1 = __importDefault(require("../../models/singer-follow.model"));
function readPositiveInt(value, fallback, max) {
    const candidate = typeof value === "string" ? Number(value) : NaN;
    return Number.isSafeInteger(candidate) && candidate > 0
        ? Math.min(candidate, max)
        : fallback;
}
const detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const artistKey = String(req.params.artistKey || "").trim();
    if (!artistKey || artistKey.length > 160) {
        res.status(400).json({ code: "INVALID_ARTIST", message: "Đường dẫn nghệ sĩ không hợp lệ" });
        return;
    }
    const page = readPositiveInt(req.query.page, 1, 1000);
    const limit = readPositiveInt(req.query.limit, 12, 50);
    try {
        const identifier = mongoose_1.default.isValidObjectId(artistKey)
            ? { _id: artistKey }
            : { slug: artistKey };
        const artist = yield singer_model_1.default.findOne(Object.assign(Object.assign({}, identifier), { deleted: false, status: "active" })).select("_id fullName avatar slug").lean();
        if (!artist) {
            res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy nghệ sĩ" });
            return;
        }
        const singerId = String(artist._id);
        const filter = { singerId, deleted: false, status: "active" };
        const [songs, songCount, followerCount] = yield Promise.all([
            song_model_1.default.find(filter)
                .select("_id title slug avatar listen like")
                .sort({ listen: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            song_model_1.default.countDocuments(filter),
            singer_follow_model_1.default.countDocuments({ singerId }),
        ]);
        res.json({
            code: 200,
            data: {
                artist: {
                    _id: singerId,
                    fullName: artist.fullName || "Nghệ sĩ",
                    slug: artist.slug || "",
                    avatar: artist.avatar || "",
                    followerCount,
                    songCount,
                },
                songs: songs.map((song) => { var _a, _b; return ({
                    _id: String(song._id),
                    title: song.title || "Bài hát",
                    slug: song.slug || "",
                    avatar: song.avatar || "",
                    listen: (_a = song.listen) !== null && _a !== void 0 ? _a : 0,
                    like: (_b = song.like) !== null && _b !== void 0 ? _b : 0,
                }); }),
                pagination: {
                    page,
                    limit,
                    total: songCount,
                    totalPages: Math.ceil(songCount / limit),
                },
            },
        });
    }
    catch (error) {
        console.error("[artists/detail]", error);
        res.status(500).json({ code: 500, message: "Không thể tải thông tin nghệ sĩ" });
    }
});
exports.detail = detail;
