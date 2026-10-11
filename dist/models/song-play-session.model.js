"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    playId: { type: String, required: true, unique: true },
    songId: { type: String, required: true },
    userId: { type: String, default: null },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
}, { collection: "song_play_sessions", timestamps: true });
schema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });
exports.default = mongoose_1.default.models.SongPlaySession ||
    mongoose_1.default.model("SongPlaySession", schema);
