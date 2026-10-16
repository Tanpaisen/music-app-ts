import TopicCategory from "../models/topic-category.model";
import { TOPIC_CATEGORIES } from "../config/topic-categories";

// Dữ liệu mặc định chỉ tạo khi collection HOÀN TOÀN chưa có dữ liệu.
// Sau lần đầu, mọi thay đổi nằm trong MongoDB/Admin, không bị cấu hình cứng ghi đè.
let loaded = false;
let pending: Promise<void> | null = null;
export async function ensureTopicCategories(): Promise<void> {
  if (loaded) return;
  if (!pending) {
    pending = (async () => {
      const exists = await TopicCategory.exists({}); // Bao gồm cả đã xóa mềm.
      if (!exists) {
        for (const item of TOPIC_CATEGORIES) {
          await TopicCategory.updateOne(
            { key: item.key },
            { $setOnInsert: { key: item.key, label: item.label, description: item.description,
              sortOrder: item.order, coverImage: "", status: "active", deleted: false } },
            { upsert: true }
          );
        }
      }
      loaded = true;
    })().finally(() => { pending = null; });
  }
  await pending;
}

export async function categoryExists(key: string): Promise<boolean> {
  await ensureTopicCategories();
  return Boolean(await TopicCategory.exists({ key, deleted: false, status: "active" }));
}

export async function listCategories(activeOnly = false) {
  await ensureTopicCategories();
  return TopicCategory.find({ deleted: false, ...(activeOnly ? { status: "active" } : {}) })
    .sort({ sortOrder: 1, label: 1 }).lean();
}
