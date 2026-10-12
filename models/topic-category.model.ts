import mongoose from "mongoose";

export interface TopicCategoryData {
  key: string;
  label: string;
  description: string;
  coverImage: string;
  sortOrder: number;
  status: "active" | "inactive";
  deleted: boolean;
}

const topicCategorySchema = new mongoose.Schema<TopicCategoryData>({
  key: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  label: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 500 },
  coverImage: { type: String, default: "" },
  sortOrder: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

topicCategorySchema.index({ deleted: 1, status: 1, sortOrder: 1 });

const TopicCategory = mongoose.model<TopicCategoryData>("TopicCategory", topicCategorySchema, "topic_categories");
export default TopicCategory;
