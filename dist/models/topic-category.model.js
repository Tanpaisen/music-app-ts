"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const topicCategorySchema = new mongoose_1.default.Schema({
    key: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 500 },
    coverImage: { type: String, default: "" },
    sortOrder: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    deleted: { type: Boolean, default: false },
}, { timestamps: true });
topicCategorySchema.index({ deleted: 1, status: 1, sortOrder: 1 });
const TopicCategory = mongoose_1.default.model("TopicCategory", topicCategorySchema, "topic_categories");
exports.default = TopicCategory;
