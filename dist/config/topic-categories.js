"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOPIC_CATEGORY_KEYS = exports.DEFAULT_TOPIC_CATEGORY = exports.TOPIC_CATEGORIES = void 0;
exports.isTopicCategory = isTopicCategory;
exports.TOPIC_CATEGORIES = [
    { key: "tam-trang-hoat-dong", label: "Tâm trạng & Hoạt động", description: "Nhạc cho mọi khoảnh khắc", order: 10 },
    { key: "tru-tinh-bolero", label: "Trữ tình & Bolero", description: "Những giai điệu sâu lắng", order: 20 },
    { key: "the-loai", label: "Thể loại âm nhạc", description: "Khám phá màu sắc âm nhạc", order: 30 },
    { key: "quoc-te", label: "Nhạc quốc tế", description: "Âm nhạc từ khắp thế giới", order: 40 },
    { key: "theo-mua-su-kien", label: "Theo mùa & Sự kiện", description: "Không khí của từng dịp đặc biệt", order: 50 },
    { key: "khac", label: "Các chủ đề khác", description: "Khám phá thêm", order: 60 },
];
exports.DEFAULT_TOPIC_CATEGORY = "khac";
exports.TOPIC_CATEGORY_KEYS = exports.TOPIC_CATEGORIES.map(c => c.key);
function isTopicCategory(value) {
    return typeof value === "string" && exports.TOPIC_CATEGORY_KEYS.some(key => key === value);
}
