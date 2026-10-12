"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureTopicCategories = ensureTopicCategories;
exports.categoryExists = categoryExists;
exports.listCategories = listCategories;
const topic_category_model_1 = __importDefault(require("../models/topic-category.model"));
const topic_categories_1 = require("../config/topic-categories");
let loaded = false;
let pending = null;
function ensureTopicCategories() {
    return __awaiter(this, void 0, void 0, function* () {
        if (loaded)
            return;
        if (!pending) {
            pending = (() => __awaiter(this, void 0, void 0, function* () {
                const exists = yield topic_category_model_1.default.exists({});
                if (!exists) {
                    for (const item of topic_categories_1.TOPIC_CATEGORIES) {
                        yield topic_category_model_1.default.updateOne({ key: item.key }, { $setOnInsert: { key: item.key, label: item.label, description: item.description,
                                sortOrder: item.order, coverImage: "", status: "active", deleted: false } }, { upsert: true });
                    }
                }
                loaded = true;
            }))().finally(() => { pending = null; });
        }
        yield pending;
    });
}
function categoryExists(key) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ensureTopicCategories();
        return Boolean(yield topic_category_model_1.default.exists({ key, deleted: false, status: "active" }));
    });
}
function listCategories() {
    return __awaiter(this, arguments, void 0, function* (activeOnly = false) {
        yield ensureTopicCategories();
        return topic_category_model_1.default.find(Object.assign({ deleted: false }, (activeOnly ? { status: "active" } : {})))
            .sort({ sortOrder: 1, label: 1 }).lean();
    });
}
