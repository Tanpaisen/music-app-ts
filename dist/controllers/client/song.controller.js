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
exports.listenPatch = exports.favorite = exports.favoritePatch = exports.like = exports.detail = exports.list = void 0;
const song_model_1 = __importDefault(require("../../models/song.model"));
const topic_model_1 = __importDefault(require("../../models/topic.model"));
const singer_model_1 = __importDefault(require("../../models/singer.model"));
const favorite_song_model_1 = __importDefault(require("../../models/favorite.song.model"));
const song_service_1 = require("../../services/song.service");
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const slug = req.params.songSlug;
    if (!slug) {
        return res.status(400).json({ message: "Missing songSlug parameter" });
    }
    const topic = yield topic_model_1.default.findOne({
        slug: slug,
        deleted: false
    });
    if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
    }
    const songs = yield song_model_1.default.find({
        topicId: topic.id,
    }).lean();
    for (const song of songs) {
        const singer = yield singer_model_1.default.findById(song.singerId).select("fullName");
        song.singer = singer;
    }
    res.render("client/pages/songs/list", {
        pageTitle: "Danh sách bài hát",
        topic: topic,
        songs: songs
    });
});
exports.list = list;
const detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { songSlug } = req.params;
        if (!songSlug) {
            return res.status(400).json({ code: 400, message: "Thiếu songSlug" });
        }
        const data = yield song_service_1.songService.getSongDetail(songSlug.toString());
        if (!data) {
            return res.status(404).json({ code: 404, message: "Không tìm thấy bài hát" });
        }
        res.json({ code: 200, message: "Thành công", data });
    }
    catch (error) {
        console.error("[song.controller/detail]", error);
        res.status(500).json({ code: 500, message: "Lỗi máy chủ" });
    }
});
exports.detail = detail;
const like = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const songId = req.params.songId;
    const status = req.params.status;
    const song = yield song_model_1.default.findOne({
        _id: songId,
        deleted: false,
        status: "active"
    });
    let like = 0;
    if (song) {
        like = (_a = song.like) !== null && _a !== void 0 ? _a : 0;
    }
    const newLike = status == "like" ? like + 1 : like - 1;
    yield song_model_1.default.updateOne({
        _id: songId,
        deleted: false,
        status: "active"
    }, {
        like: newLike
    });
    res.json({
        code: 200,
        message: "Thành công",
        like: newLike
    });
});
exports.like = like;
const favoritePatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.songId;
    const status = req.params.status;
    if (status == "favorite") {
        const favoriteSong = new favorite_song_model_1.default({
            songId: id,
            userId: "",
        });
        yield favoriteSong.save();
    }
    else {
        yield favorite_song_model_1.default.deleteOne({
            songId: id,
            userId: "",
        });
    }
    res.json({
        code: 200,
        message: status == "favorite" ? "Đã thêm vào yêu thích" : "Đã xóa yêu thích"
    });
});
exports.favoritePatch = favoritePatch;
const favorite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const favoriteSongs = yield favorite_song_model_1.default.find({
        deleted: false,
        userId: "",
    }).lean();
    for (const item of favoriteSongs) {
        const song = yield song_model_1.default.findOne({
            _id: item.songId,
            deleted: false,
            status: "active"
        }).lean();
        if (song) {
            item.song = song;
            const singer = yield singer_model_1.default.findOne({
                _id: song.singerId,
                deleted: false
            }).lean();
            item.singer = singer;
        }
    }
    res.render("client/pages/songs/favorite", {
        pageTitle: "Trang bài hát yêu thích",
        favoriteSongs: favoriteSongs
    });
});
exports.favorite = favorite;
const listenPatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const songSlug = req.params.songSlug;
    const song = yield song_model_1.default.findOne({
        slug: songSlug,
        deleted: false,
        status: "active"
    });
    if (!song) {
        return res.json({
            code: 404,
            message: "Không tìm thấy bài hát"
        });
    }
    const currentListen = (_a = song.listen) !== null && _a !== void 0 ? _a : 0;
    const newListen = currentListen + 1;
    yield song_model_1.default.updateOne({
        slug: songSlug,
        deleted: false,
        status: "active"
    }, {
        listen: newListen
    });
    res.json({
        code: 200,
        message: "Đã xem",
        listen: newListen
    });
});
exports.listenPatch = listenPatch;
