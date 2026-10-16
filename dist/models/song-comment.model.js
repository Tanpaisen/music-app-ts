"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const songCommentSchema = new mongoose_1.default.Schema({
    songId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
}, { timestamps: true, collection: "song_comments" });
songCommentSchema.index({ songId: 1, createdAt: -1, _id: -1 });
const SongComment = mongoose_1.default.model("SongComment", songCommentSchema, "song_comments");
exports.default = SongComment;
