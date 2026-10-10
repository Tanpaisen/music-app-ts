"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.songRepository = void 0;
const song_model_1 = __importDefault(require("../models/song.model"));
const SONG_SELECT = "title avatar slug like listen singerId topicId audio lyrics description createdAt";
exports.songRepository = {
    findTopByListen(limit) {
        return song_model_1.default.find({ deleted: false, status: "active" })
            .sort({ listen: -1 })
            .limit(limit)
            .select(SONG_SELECT)
            .lean();
    },
    findLatest(limit) {
        return song_model_1.default.find({ deleted: false, status: "active" })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select(SONG_SELECT)
            .lean();
    },
    findBySlug(slug) {
        return song_model_1.default.findOne({ slug, deleted: false, status: "active" })
            .select("title avatar slug like listen singerId topicId audio lyrics description createdAt")
            .lean();
    },
    findRelated(topicId, excludeSlug, limit) {
        if (!topicId)
            return Promise.resolve([]);
        return song_model_1.default.find({
            topicId,
            slug: { $ne: excludeSlug },
            deleted: false,
            status: "active",
        })
            .sort({ listen: -1 })
            .limit(limit)
            .select("title avatar slug like listen singerId")
            .lean();
    },
    incrementListen(slug) {
        return song_model_1.default.updateOne({ slug }, { $inc: { listen: 1 } });
    },
};
