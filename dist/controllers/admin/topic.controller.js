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
exports.changeStatus = exports.deleteOne = exports.editPatch = exports.createPost = exports.create = exports.edit = exports.detail = exports.index = void 0;
const topic_model_1 = __importDefault(require("../../models/topic.model"));
const topic_categories_1 = require("../../config/topic-categories");
const topic_category_service_1 = require("../../services/topic-category.service");
const system_1 = require("../../config/system");
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield (0, topic_category_service_1.listCategories)();
    const topics = yield topic_model_1.default.find({
        deleted: false,
    });
    res.render('admin/pages/topics/index', {
        pageTitle: "Trang quản lý chủ đề",
        topics: topics,
        categoryLabels: Object.fromEntries(categories.map(c => [c.key, c.label])),
    });
});
exports.index = index;
const detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const topic = yield topic_model_1.default.findOne({
        _id: id,
        deleted: false,
        status: "active"
    });
    res.render('admin/pages/topics/detail', {
        pageTitle: "Trang chi tiết chủ đề",
        topic: topic,
        topicCategories: yield (0, topic_category_service_1.listCategories)(true),
    });
});
exports.detail = detail;
const edit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const topic = yield topic_model_1.default.findOne({
        _id: id,
        deleted: false,
    });
    res.render('admin/pages/topics/edit', {
        pageTitle: "Trang chỉnh sửa chủ đề",
        topic: topic,
        topicCategories: yield (0, topic_category_service_1.listCategories)(true),
    });
});
exports.edit = edit;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('admin/pages/topics/create', {
        pageTitle: "Trang thêm mới chủ đề",
        topicCategories: yield (0, topic_category_service_1.listCategories)(true),
    });
});
exports.create = create;
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryKey = String(req.body.categoryKey || topic_categories_1.DEFAULT_TOPIC_CATEGORY);
    if (!(yield (0, topic_category_service_1.categoryExists)(categoryKey))) {
        res.status(400).send("Danh mục không hợp lệ");
        return;
    }
    const data = {
        title: req.body.title,
        description: req.body.description,
        avatar: req.body.avatar,
        status: req.body.status === "active" ? "active" : "inactive",
        categoryKey,
        featured: req.body.featured === "on",
        sortOrder: Math.max(0, Math.min(9999, Number(req.body.sortOrder) || 0)),
    };
    const topic = new topic_model_1.default(data);
    yield topic.save();
    const backUrl = req.get("Referer") || `/${system_1.systemConfig.prefixAdmin}/topics`;
    res.redirect(backUrl);
});
exports.createPost = createPost;
const editPatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    if (!(yield (0, topic_category_service_1.categoryExists)(String(req.body.categoryKey || "")))) {
        res.status(400).send("Danh mục chủ đề không hợp lệ");
        return;
    }
    const changes = Object.assign(Object.assign({ title: String(req.body.title || "").trim(), description: String(req.body.description || "") }, (req.body.avatar ? { avatar: String(req.body.avatar) } : {})), { status: req.body.status === "active" ? "active" : "inactive", categoryKey: req.body.categoryKey, featured: req.body.featured === "on", sortOrder: Math.max(0, Math.min(9999, Number(req.body.sortOrder) || 0)) });
    if (!changes.title) {
        res.status(400).send("Vui lòng nhập tiêu đề");
        return;
    }
    yield topic_model_1.default.updateOne({
        _id: id,
        deleted: false
    }, { $set: changes });
    const backUrl = req.get("Referer") || `/${system_1.systemConfig.prefixAdmin}/topics`;
    res.redirect(backUrl);
});
exports.editPatch = editPatch;
const deleteOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield topic_model_1.default.updateOne({
        _id: req.params.id,
        deleted: false
    }, {
        deleted: true
    });
    const backUrl = req.get("Referer") || `/${system_1.systemConfig.prefixAdmin}/topics`;
    res.redirect(backUrl);
});
exports.deleteOne = deleteOne;
const changeStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, id } = req.params;
    yield topic_model_1.default.updateOne({
        _id: id,
        deleted: false
    }, {
        status: status
    });
    const backUrl = req.get("Referer") || `/${system_1.systemConfig.prefixAdmin}/topics`;
    res.redirect(backUrl);
});
exports.changeStatus = changeStatus;
