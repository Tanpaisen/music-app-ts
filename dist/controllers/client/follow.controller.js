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
exports.myFollowing = exports.unfollow = exports.follow = exports.status = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const singer_model_1 = __importDefault(require("../../models/singer.model"));
const singer_follow_model_1 = __importDefault(require("../../models/singer-follow.model"));
const isValidId = (id) => mongoose_1.default.isValidObjectId(id);
const status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const singerId = String(req.params.singerId);
    if (!isValidId(singerId)) {
        res.status(400).json({ code: "INVALID_SINGER", message: "singerId không hợp lệ" });
        return;
    }
    try {
        const singer = yield singer_model_1.default.exists({ _id: singerId, deleted: false, status: "active" });
        if (!singer) {
            res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy nghệ sĩ" });
            return;
        }
        const userId = res.locals.authUserId;
        const exists = yield singer_follow_model_1.default.exists({ userId, singerId });
        res.json({ code: 200, following: Boolean(exists) });
    }
    catch (error) {
        console.error("[follows/status]", error);
        res.status(500).json({ code: 500, message: "Không thể tải trạng thái theo dõi" });
    }
});
exports.status = status;
const follow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const singerId = String(req.params.singerId);
    if (!isValidId(singerId)) {
        res.status(400).json({ code: "INVALID_SINGER", message: "singerId không hợp lệ" });
        return;
    }
    try {
        const singer = yield singer_model_1.default.exists({ _id: singerId, deleted: false, status: "active" });
        if (!singer) {
            res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy nghệ sĩ" });
            return;
        }
        const userId = res.locals.authUserId;
        yield singer_follow_model_1.default.updateOne({ userId, singerId }, { $setOnInsert: { userId, singerId } }, { upsert: true });
        res.json({ code: 200, message: "Đã theo dõi nghệ sĩ", following: true });
    }
    catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
            res.json({ code: 200, message: "Đã theo dõi nghệ sĩ", following: true });
            return;
        }
        console.error("[follows/follow]", error);
        res.status(500).json({ code: 500, message: "Không thể theo dõi nghệ sĩ" });
    }
});
exports.follow = follow;
const unfollow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const singerId = String(req.params.singerId);
    if (!isValidId(singerId)) {
        res.status(400).json({ code: "INVALID_SINGER", message: "singerId không hợp lệ" });
        return;
    }
    try {
        const userId = res.locals.authUserId;
        yield singer_follow_model_1.default.deleteOne({ userId, singerId });
        res.json({ code: 200, message: "Đã bỏ theo dõi nghệ sĩ", following: false });
    }
    catch (error) {
        console.error("[follows/unfollow]", error);
        res.status(500).json({ code: 500, message: "Không thể bỏ theo dõi nghệ sĩ" });
    }
});
exports.unfollow = unfollow;
const myFollowing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);
    const page = Number.isInteger(rawPage) ? Math.min(1000, Math.max(1, rawPage)) : 1;
    const limit = Number.isInteger(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 20;
    try {
        const userId = res.locals.authUserId;
        const [items, total] = yield Promise.all([
            singer_follow_model_1.default.find({ userId })
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            singer_follow_model_1.default.countDocuments({ userId }),
        ]);
        const singerIds = items.map((entry) => entry.singerId).filter(isValidId);
        const singers = yield singer_model_1.default.find({
            _id: { $in: singerIds }, deleted: false, status: "active",
        }).select("_id fullName slug avatar").lean();
        const singerMap = new Map(singers.map((item) => [String(item._id), item]));
        const data = items.flatMap((entry) => {
            const singer = singerMap.get(entry.singerId);
            if (!singer)
                return [];
            return [{
                    singerId: entry.singerId,
                    fullName: singer.fullName || "Nghệ sĩ",
                    slug: singer.slug || "",
                    avatar: singer.avatar || "",
                    followedAt: entry.createdAt,
                }];
        });
        res.json({
            code: 200, data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error("[follows/me]", error);
        res.status(500).json({ code: 500, message: "Không thể tải danh sách nghệ sĩ" });
    }
});
exports.myFollowing = myFollowing;
