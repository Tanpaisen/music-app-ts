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
exports.remove = exports.update = exports.create = exports.count = exports.list = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const song_model_1 = __importDefault(require("../../models/song.model"));
const song_comment_model_1 = __importDefault(require("../../models/song-comment.model"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const getContent = (body) => {
    if (typeof (body === null || body === void 0 ? void 0 : body.content) !== "string")
        return null;
    const text = body.content.trim();
    return text.length >= 1 && text.length <= 1000 ? text : null;
};
const validId = (id) => mongoose_1.default.isValidObjectId(id);
const serialize = (item, authorName, currentUserId) => ({
    id: String(item._id),
    songId: item.songId,
    content: item.content,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    author: { id: item.userId, fullName: authorName },
    isMine: Boolean(currentUserId && currentUserId === item.userId),
});
const songExists = (songId) => song_model_1.default.exists({ _id: songId, deleted: false, status: "active" });
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const songId = String(req.params.songId);
    if (!validId(songId)) {
        res.status(400).json({ code: "INVALID_SONG", message: "songId không hợp lệ" });
        return;
    }
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);
    const page = Number.isInteger(rawPage) ? Math.max(1, Math.min(1000, rawPage)) : 1;
    const limit = Number.isInteger(rawLimit) ? Math.max(1, Math.min(20, rawLimit)) : 10;
    try {
        if (!(yield songExists(songId))) {
            res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy bài hát" });
            return;
        }
        const [items, total] = yield Promise.all([
            song_comment_model_1.default.find({ songId })
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            song_comment_model_1.default.countDocuments({ songId }),
        ]);
        const userIds = [...new Set(items.map((item) => item.userId))].filter(validId);
        const users = yield user_model_1.default.find({ _id: { $in: userIds } }).select("_id fullName").lean();
        const names = new Map(users.map((user) => [String(user._id), user.fullName]));
        const currentUserId = (_a = req.session) === null || _a === void 0 ? void 0 : _a.clientUserId;
        res.json({
            code: 200,
            data: items.map((item) => serialize(item, names.get(item.userId) || "Người dùng", currentUserId)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error("[comments/list]", error);
        res.status(500).json({ code: 500, message: "Không thể tải bình luận" });
    }
});
exports.list = list;
const count = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const songId = String(req.params.songId);
    if (!validId(songId)) {
        res.status(400).json({ code: "INVALID_SONG", message: "songId không hợp lệ" });
        return;
    }
    try {
        if (!(yield songExists(songId))) {
            res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy bài hát" });
            return;
        }
        res.json({ code: 200, count: yield song_comment_model_1.default.countDocuments({ songId }) });
    }
    catch (error) {
        console.error("[comments/count]", error);
        res.status(500).json({ code: 500, message: "Không thể lấy số bình luận" });
    }
});
exports.count = count;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const songId = String(req.params.songId);
    const content = getContent(req.body);
    if (!validId(songId) || content === null) {
        res.status(400).json({ code: "INVALID_INPUT", message: "Bình luận phải có từ 1 đến 1000 ký tự" });
        return;
    }
    try {
        if (!(yield songExists(songId))) {
            res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy bài hát" });
            return;
        }
        const userId = res.locals.authUserId;
        const user = res.locals.authUser;
        const item = yield song_comment_model_1.default.create({ songId, userId, content });
        res.status(201).json({ code: 201, data: serialize(item, user.fullName || "Người dùng", userId) });
    }
    catch (error) {
        console.error("[comments/create]", error);
        res.status(500).json({ code: 500, message: "Không thể gửi bình luận" });
    }
});
exports.create = create;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const commentId = String(req.params.commentId);
    const content = getContent(req.body);
    if (!validId(commentId) || content === null) {
        res.status(400).json({ code: "INVALID_INPUT", message: "Bình luận phải có từ 1 đến 1000 ký tự" });
        return;
    }
    try {
        const userId = res.locals.authUserId;
        const user = res.locals.authUser;
        const item = yield song_comment_model_1.default.findOneAndUpdate({ _id: commentId, userId }, { $set: { content } }, { returnDocument: "after", runValidators: true });
        if (!item) {
            res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy bình luận của bạn" });
            return;
        }
        res.json({ code: 200, data: serialize(item, user.fullName || "Người dùng", userId) });
    }
    catch (error) {
        console.error("[comments/update]", error);
        res.status(500).json({ code: 500, message: "Không thể sửa bình luận" });
    }
});
exports.update = update;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const commentId = String(req.params.commentId);
    if (!validId(commentId)) {
        res.status(400).json({ code: "INVALID_ID", message: "commentId không hợp lệ" });
        return;
    }
    try {
        const userId = res.locals.authUserId;
        const deleted = yield song_comment_model_1.default.deleteOne({ _id: commentId, userId });
        if (deleted.deletedCount === 0) {
            res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy bình luận của bạn" });
            return;
        }
        res.json({ code: 200, message: "Đã xóa bình luận" });
    }
    catch (error) {
        console.error("[comments/remove]", error);
        res.status(500).json({ code: 500, message: "Không thể xóa bình luận" });
    }
});
exports.remove = remove;
