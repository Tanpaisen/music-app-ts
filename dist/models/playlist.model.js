"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const playlistSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    songIds: { type: [String], default: [] },
}, { timestamps: true, collection: "playlists" });
playlistSchema.index({ userId: 1, updatedAt: -1 });
const Playlist = mongoose_1.default.model("Playlist", playlistSchema, "playlists");
exports.default = Playlist;
