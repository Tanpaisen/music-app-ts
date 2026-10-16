"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const favoriteSongSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, index: true },
    songId: { type: String, required: true, index: true },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: "favorite-songs" });
favoriteSongSchema.index({ userId: 1, songId: 1 }, { unique: true });
const FavoriteSong = mongoose_1.default.model("FavoriteSong", favoriteSongSchema);
exports.default = FavoriteSong;
