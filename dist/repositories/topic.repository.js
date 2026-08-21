"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.topicRepository = void 0;
const topic_model_1 = __importDefault(require("../models/topic.model"));
exports.topicRepository = {
    findFeatured(limit) {
        return topic_model_1.default.find({ deleted: false, status: "active" })
            .select("title slug avatar description")
            .limit(limit)
            .lean();
    },
    findByIds(ids) {
        if (ids.length === 0)
            return Promise.resolve([]);
        return topic_model_1.default.find({ _id: { $in: ids } }).select("title slug").lean();
    },
};
