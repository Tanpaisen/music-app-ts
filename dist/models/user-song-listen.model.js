"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, index: true },
    songId: { type: String, required: true },
    listenCount: { type: Number, default: 0, min: 0 },
    lastListenedAt: { type: Date, default: Date.now },
}, { collection: "user_song_listens", timestamps: true });
schema.index({ userId: 1, songId: 1 }, { unique: true });
schema.index({ userId: 1, listenCount: -1, lastListenedAt: -1 });
exports.default = mongoose_1.default.models.UserSongListen ||
    mongoose_1.default.model("UserSongListen", schema);
