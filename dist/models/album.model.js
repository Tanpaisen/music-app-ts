"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_slug_updater_1 = __importDefault(require("mongoose-slug-updater"));
mongoose_1.default.plugin(mongoose_slug_updater_1.default);
const albumSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true, trim: true, maxlength: 160 },
    avatar: { type: String, default: "" },
    description: { type: String, default: "" },
    singerId: { type: String, default: "", index: true },
    releaseDate: { type: Date, default: null },
    slug: { type: String, slug: "title", unique: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
albumSchema.index({ deleted: 1, status: 1, createdAt: -1 });
const Album = (_a = mongoose_1.default.models.Album) !== null && _a !== void 0 ? _a : mongoose_1.default.model("Album", albumSchema, "albums");
exports.default = Album;
