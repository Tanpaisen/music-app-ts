"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const singerFollowSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, index: true },
    singerId: { type: String, required: true, index: true },
}, { timestamps: true, collection: "singer_follows" });
singerFollowSchema.index({ userId: 1, singerId: 1 }, { unique: true });
singerFollowSchema.index({ userId: 1, createdAt: -1 });
const SingerFollow = mongoose_1.default.model("SingerFollow", singerFollowSchema, "singer_follows");
exports.default = SingerFollow;
