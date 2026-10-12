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
exports.deleteOne = exports.editPatch = exports.edit = exports.createPost = exports.create = exports.index = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const album_model_1 = __importDefault(require("../../models/album.model"));
const song_model_1 = __importDefault(require("../../models/song.model"));
const singer_model_1 = __importDefault(require("../../models/singer.model"));
const system_1 = require("../../config/system");
const base = `/${system_1.systemConfig.prefixAdmin}/albums`;
const validId = (id) => typeof id === "string" && mongoose_1.default.isValidObjectId(id);
const text = (value) => typeof value === "string" ? value.trim() : "";
const image = (value) => typeof value === "string" ? value : (Array.isArray(value) && typeof value[0] === "string" ? value[0] : "");
function parseDate(value) {
    const raw = text(value);
    if (!raw)
        return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw))
        throw new Error("INVALID_DATE");
    const date = new Date(`${raw}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw)
        throw new Error("INVALID_DATE");
    return date;
}
function fields(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const title = text((_a = req.body) === null || _a === void 0 ? void 0 : _a.title);
        const singerId = text((_b = req.body) === null || _b === void 0 ? void 0 : _b.singerId);
        if (!title || title.length > 160)
            throw new Error("INVALID_TITLE");
        if (singerId && (!validId(singerId) || !(yield singer_model_1.default.exists({ _id: singerId, deleted: false })))) {
            throw new Error("INVALID_SINGER");
        }
        return {
            title,
            singerId,
            description: text((_c = req.body) === null || _c === void 0 ? void 0 : _c.description),
            releaseDate: parseDate((_d = req.body) === null || _d === void 0 ? void 0 : _d.releaseDate),
            status: (((_e = req.body) === null || _e === void 0 ? void 0 : _e.status) === "inactive" ? "inactive" : "active"),
        };
    });
}
function onError(res, err) {
    const code = err instanceof Error ? err.message : "";
    if (code.startsWith("INVALID_")) {
        res.status(400).send("Dữ liệu album không hợp lệ. Kiểm tra tên, ca sĩ và ngày phát hành.");
        return;
    }
    if ((err === null || err === void 0 ? void 0 : err.code) === 11000) {
        res.status(409).send("Album trùng slug. Hãy chọn tên khác.");
        return;
    }
    console.error("[admin/albums]", err);
    res.status(500).send("Có lỗi khi lưu album.");
}
const index = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const albums = yield album_model_1.default.find({ deleted: false }).sort({ createdAt: -1 }).lean();
        const singers = yield singer_model_1.default.find({ _id: { $in: albums.map(a => a.singerId).filter(validId) } }).select("fullName").lean();
        const singerMap = new Map(singers.map(s => [String(s._id), s.fullName]));
        const countRows = yield song_model_1.default.aggregate([
            { $match: { deleted: false, albumId: { $in: albums.map(a => String(a._id)) } } },
            { $group: { _id: "$albumId", count: { $sum: 1 } } },
        ]);
        const counts = new Map(countRows.map(r => [String(r._id), Number(r.count)]));
        res.render("admin/pages/albums/index", { pageTitle: "Quản lý album", albums,
            singerMap: Object.fromEntries(singerMap), counts: Object.fromEntries(counts) });
    }
    catch (err) {
        onError(res, err);
    }
});
exports.index = index;
const create = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const singers = yield singer_model_1.default.find({ deleted: false, status: "active" }).select("fullName").sort({ fullName: 1 }).lean();
    res.render("admin/pages/albums/form", { pageTitle: "Thêm album", album: null, singers,
        action: `${base}/create` });
});
exports.create = create;
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const data = yield fields(req);
        const avatar = image((_a = req.body) === null || _a === void 0 ? void 0 : _a.avatar);
        yield album_model_1.default.create(Object.assign(Object.assign({}, data), (avatar ? { avatar } : {})));
        res.redirect(base);
    }
    catch (err) {
        onError(res, err);
    }
});
exports.createPost = createPost;
const edit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!validId(req.params.id)) {
        res.status(404).send("Không tìm thấy album.");
        return;
    }
    const album = yield album_model_1.default.findOne({ _id: req.params.id, deleted: false }).lean();
    if (!album) {
        res.status(404).send("Không tìm thấy album.");
        return;
    }
    const singers = yield singer_model_1.default.find({ deleted: false }).select("fullName").sort({ fullName: 1 }).lean();
    res.render("admin/pages/albums/form", { pageTitle: "Chỉnh sửa album", album, singers,
        action: `${base}/edit/${album._id}?_method=PATCH` });
});
exports.edit = edit;
const editPatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!validId(req.params.id)) {
        res.status(404).send("Không tìm thấy album.");
        return;
    }
    try {
        const album = yield album_model_1.default.findOne({ _id: req.params.id, deleted: false });
        if (!album) {
            res.status(404).send("Không tìm thấy album.");
            return;
        }
        const data = yield fields(req);
        Object.assign(album, data);
        const avatar = image((_a = req.body) === null || _a === void 0 ? void 0 : _a.avatar);
        if (avatar)
            album.avatar = avatar;
        yield album.save();
        res.redirect(base);
    }
    catch (err) {
        onError(res, err);
    }
});
exports.editPatch = editPatch;
const deleteOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!validId(req.params.id)) {
        res.status(404).send("Không tìm thấy album.");
        return;
    }
    try {
        const count = yield song_model_1.default.countDocuments({ albumId: req.params.id, deleted: false });
        if (count) {
            res.status(409).send("Album đang có bài hát. Hãy bỏ liên kết album ở các bài hát trước khi xóa.");
            return;
        }
        yield album_model_1.default.updateOne({ _id: req.params.id, deleted: false }, { $set: { deleted: true, deletedAt: new Date() } });
        res.redirect(base);
    }
    catch (err) {
        onError(res, err);
    }
});
exports.deleteOne = deleteOne;
