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
exports.removeSong = exports.addSong = exports.remove = exports.update = exports.detail = exports.create = exports.list = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const playlist_model_1 = __importDefault(require("../../models/playlist.model"));
const song_model_1 = __importDefault(require("../../models/song.model"));
const singer_model_1 = __importDefault(require("../../models/singer.model"));
const owner = (res) => res.locals.authUserId;
const isId = (value) => mongoose_1.default.isValidObjectId(value);
const summary = (playlist, songId) => { var _a; var _b, _c, _d; return (Object.assign(Object.assign({ id: String(playlist._id), name: playlist.name, description: (_b = playlist.description) !== null && _b !== void 0 ? _b : "", songCount: (_c = (_a = playlist.songIds) === null || _a === void 0 ? void 0 : _a.length) !== null && _c !== void 0 ? _c : 0 }, (songId ? { containsSong: ((_d = playlist.songIds) !== null && _d !== void 0 ? _d : []).includes(songId) } : {})), { createdAt: playlist.createdAt, updatedAt: playlist.updatedAt })); };
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const value = req.query.songId;
        if (value !== undefined && (typeof value !== "string" || !isId(value))) {
            res.status(400).json({ code: "INVALID_SONG_ID", message: "songId không hợp lệ" });
            return;
        }
        const songId = typeof value === "string" ? value : undefined;
        const playlists = yield playlist_model_1.default.find({ userId: owner(res) }).sort({ updatedAt: -1 }).lean();
        res.setHeader("Cache-Control", "no-store");
        res.json({ code: 200, data: playlists.map((p) => summary(p, songId)) });
    }
    catch (error) {
        console.error("[playlists/list]", error);
        res.status(500).json({ message: "Không tải được playlist" });
    }
});
exports.list = list;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, description = "" } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
    if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 80 ||
        typeof description !== "string" || description.trim().length > 500) {
        res.status(400).json({ message: "Tên playlist phải từ 1–80 ký tự; mô tả tối đa 500 ký tự" });
        return;
    }
    try {
        const playlist = yield playlist_model_1.default.create({
            userId: owner(res), name: name.trim(), description: description.trim(), songIds: [],
        });
        res.status(201).json({ code: 201, message: "Đã tạo playlist", data: summary(playlist) });
    }
    catch (error) {
        console.error("[playlists/create]", error);
        res.status(500).json({ message: "Không thể tạo playlist" });
    }
});
exports.create = create;
const detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const playlistId = String(req.params.playlistId);
    if (!isId(playlistId)) {
        res.status(400).json({ message: "playlistId không hợp lệ" });
        return;
    }
    try {
        const playlist = yield playlist_model_1.default.findOne({ _id: playlistId, userId: owner(res) }).lean();
        if (!playlist) {
            res.status(404).json({ message: "Không tìm thấy playlist" });
            return;
        }
        const songIds = (_a = playlist.songIds) !== null && _a !== void 0 ? _a : [];
        const rawSongs = yield song_model_1.default.find({ _id: { $in: songIds }, deleted: false, status: "active" })
            .select("title slug avatar singerId like listen").lean();
        const singerIds = [...new Set(rawSongs.map((s) => { var _a; return String((_a = s.singerId) !== null && _a !== void 0 ? _a : ""); }).filter(isId))];
        const singers = yield singer_model_1.default.find({ _id: { $in: singerIds } }).select("fullName slug").lean();
        const singerMap = new Map(singers.map((s) => [String(s._id), { fullName: s.fullName, slug: s.slug }]));
        const songMap = new Map(rawSongs.map((s) => { var _a, _b, _c; return [String(s._id), {
                _id: String(s._id), title: s.title, slug: s.slug, avatar: s.avatar,
                like: (_a = s.like) !== null && _a !== void 0 ? _a : 0, listen: (_b = s.listen) !== null && _b !== void 0 ? _b : 0,
                singer: (_c = singerMap.get(String(s.singerId))) !== null && _c !== void 0 ? _c : null,
            }]; }));
        const songs = songIds.map((id) => songMap.get(id)).filter((song) => song != null);
        res.setHeader("Cache-Control", "no-store");
        res.json({ code: 200, data: Object.assign(Object.assign({}, summary(playlist)), { songs }) });
    }
    catch (error) {
        console.error("[playlists/detail]", error);
        res.status(500).json({ message: "Không tải được playlist" });
    }
});
exports.detail = detail;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const playlistId = String(req.params.playlistId);
    if (!isId(playlistId)) {
        res.status(400).json({ message: "playlistId không hợp lệ" });
        return;
    }
    const changes = {};
    if (Object.prototype.hasOwnProperty.call((_a = req.body) !== null && _a !== void 0 ? _a : {}, "name")) {
        if (typeof req.body.name !== "string" || req.body.name.trim().length < 1 || req.body.name.trim().length > 80) {
            res.status(400).json({ message: "Tên playlist phải từ 1–80 ký tự" });
            return;
        }
        changes.name = req.body.name.trim();
    }
    if (Object.prototype.hasOwnProperty.call((_b = req.body) !== null && _b !== void 0 ? _b : {}, "description")) {
        if (typeof req.body.description !== "string" || req.body.description.trim().length > 500) {
            res.status(400).json({ message: "Mô tả không được vượt quá 500 ký tự" });
            return;
        }
        changes.description = req.body.description.trim();
    }
    if (Object.keys(changes).length === 0) {
        res.status(400).json({ message: "Chưa có thông tin cần cập nhật" });
        return;
    }
    try {
        const playlist = yield playlist_model_1.default.findOneAndUpdate({ _id: playlistId, userId: owner(res) }, { $set: changes }, { new: true, runValidators: true });
        if (!playlist) {
            res.status(404).json({ message: "Không tìm thấy playlist" });
            return;
        }
        res.json({ code: 200, message: "Đã cập nhật playlist", data: summary(playlist) });
    }
    catch (error) {
        console.error("[playlists/update]", error);
        res.status(500).json({ message: "Không thể cập nhật playlist" });
    }
});
exports.update = update;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const playlistId = String(req.params.playlistId);
    if (!isId(playlistId)) {
        res.status(400).json({ message: "playlistId không hợp lệ" });
        return;
    }
    try {
        const playlist = yield playlist_model_1.default.findOneAndDelete({ _id: playlistId, userId: owner(res) });
        if (!playlist) {
            res.status(404).json({ message: "Không tìm thấy playlist" });
            return;
        }
        res.json({ code: 200, message: "Đã xóa playlist" });
    }
    catch (error) {
        console.error("[playlists/remove]", error);
        res.status(500).json({ message: "Không thể xóa playlist" });
    }
});
exports.remove = remove;
const addSong = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const playlistId = String(req.params.playlistId);
    const songId = String(req.params.songId);
    if (!isId(playlistId) || !isId(songId)) {
        res.status(400).json({ message: "playlistId hoặc songId không hợp lệ" });
        return;
    }
    try {
        const exists = yield song_model_1.default.exists({ _id: songId, deleted: false, status: "active" });
        if (!exists) {
            res.status(404).json({ message: "Không tìm thấy bài hát" });
            return;
        }
        const playlist = yield playlist_model_1.default.findOneAndUpdate({ _id: playlistId, userId: owner(res) }, { $addToSet: { songIds: songId } }, { new: true });
        if (!playlist) {
            res.status(404).json({ message: "Không tìm thấy playlist" });
            return;
        }
        res.json({ code: 200, message: "Đã thêm bài hát", data: summary(playlist, songId) });
    }
    catch (error) {
        console.error("[playlists/addSong]", error);
        res.status(500).json({ message: "Không thể thêm bài hát" });
    }
});
exports.addSong = addSong;
const removeSong = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const playlistId = String(req.params.playlistId);
    const songId = String(req.params.songId);
    if (!isId(playlistId) || !isId(songId)) {
        res.status(400).json({ message: "playlistId hoặc songId không hợp lệ" });
        return;
    }
    try {
        const playlist = yield playlist_model_1.default.findOneAndUpdate({ _id: playlistId, userId: owner(res) }, { $pull: { songIds: songId } }, { new: true });
        if (!playlist) {
            res.status(404).json({ message: "Không tìm thấy playlist" });
            return;
        }
        res.json({ code: 200, message: "Đã bỏ bài hát khỏi playlist", data: summary(playlist, songId) });
    }
    catch (error) {
        console.error("[playlists/removeSong]", error);
        res.status(500).json({ message: "Không thể bỏ bài hát" });
    }
});
exports.removeSong = removeSong;
