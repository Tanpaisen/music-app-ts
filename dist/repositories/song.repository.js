"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.songRepository = void 0;
const song_model_1 = __importDefault(require("../models/song.model"));
const SONG_SELECT = "title avatar slug like listen singerId topicId createdAt";
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
};
