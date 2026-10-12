// Chỉ dùng để KHỞI TẠO 6 danh mục mẫu cho MongoDB lần đầu.
// Sau đó topic_categories trên MongoDB là nguồn dữ liệu duy nhất.
export const TOPIC_CATEGORIES = [
  { key: "tam-trang-hoat-dong", label: "Tâm trạng & Hoạt động", description: "Nhạc cho mọi khoảnh khắc", order: 10 },
  { key: "tru-tinh-bolero", label: "Trữ tình & Bolero", description: "Những giai điệu sâu lắng", order: 20 },
  { key: "the-loai", label: "Thể loại âm nhạc", description: "Khám phá màu sắc âm nhạc", order: 30 },
  { key: "quoc-te", label: "Nhạc quốc tế", description: "Âm nhạc từ khắp thế giới", order: 40 },
  { key: "theo-mua-su-kien", label: "Theo mùa & Sự kiện", description: "Không khí của từng dịp đặc biệt", order: 50 },
  { key: "khac", label: "Các chủ đề khác", description: "Khám phá thêm", order: 60 },
] as const;

export type TopicCategoryKey = typeof TOPIC_CATEGORIES[number]["key"];
export const DEFAULT_TOPIC_CATEGORY: TopicCategoryKey = "khac";
export const TOPIC_CATEGORY_KEYS: TopicCategoryKey[] = TOPIC_CATEGORIES.map(c => c.key);
export function isTopicCategory(value: unknown): value is TopicCategoryKey {
  return typeof value === "string" && TOPIC_CATEGORY_KEYS.some(key => key === value);
}
