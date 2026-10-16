"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const songLikeSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, index: true },
    songId: { type: String, required: true, index: true },
}, { timestamps: true, collection: "song_likes" });
songLikeSchema.index({ userId: 1, songId: 1 }, { unique: true });
const SongLike = mongoose_1.default.model("SongLike", songLikeSchema);
exports.default = SongLike;
