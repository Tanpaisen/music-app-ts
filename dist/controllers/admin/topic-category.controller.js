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
exports.deleteOne = exports.editPatch = exports.edit = exports.createPost = exports.create = exports.index = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const topic_model_1 = __importDefault(require("../../models/topic.model"));
const topic_category_model_1 = __importDefault(require("../../models/topic-category.model"));
const topic_category_service_1 = require("../../services/topic-category.service");
const system_1 = require("../../config/system");
const base = `/${system_1.systemConfig.prefixAdmin}/topic-categories`;
const VALID_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const normalize = (val) => typeof val === "string" ? val.trim() : "";
const orderOf = (val) => Math.max(0, Math.min(9999, Math.floor(Number(val) || 0)));
function fields(req) {
    var _a, _b, _c, _d, _e;
    return {
        label: normalize((_a = req.body) === null || _a === void 0 ? void 0 : _a.label).slice(0, 120),
        description: normalize((_b = req.body) === null || _b === void 0 ? void 0 : _b.description).slice(0, 500),
        coverImage: normalize((_c = req.body) === null || _c === void 0 ? void 0 : _c.coverImage).slice(0, 1000),
        sortOrder: orderOf((_d = req.body) === null || _d === void 0 ? void 0 : _d.sortOrder),
        status: ((_e = req.body) === null || _e === void 0 ? void 0 : _e.status) === "inactive" ? "inactive" : "active",
    };
}
const index = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield (0, topic_category_service_1.listCategories)();
        const counts = yield topic_model_1.default.aggregate([
            { $match: { deleted: false } },
            { $group: { _id: { $ifNull: ["$categoryKey", "khac"] }, count: { $sum: 1 } } },
        ]);
        const counter = {};
        for (const row of counts)
            counter[String(row._id)] = row.count;
        res.render("admin/pages/topic-categories/index", { pageTitle: "Quản lý danh mục chủ đề", categories, counter });
    }
    catch (err) {
        console.error("[topic-categories/index]", err);
        res.status(500).send("Không thể tải danh mục");
    }
});
exports.index = index;
const create = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render("admin/pages/topic-categories/form", { pageTitle: "Thêm danh mục chủ đề", category: null,
        action: `${base}/create`, method: "POST" });
});
exports.create = create;
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield (0, topic_category_service_1.ensureTopicCategories)();
        const key = normalize((_a = req.body) === null || _a === void 0 ? void 0 : _a.key).toLowerCase();
        const value = fields(req);
        if (!VALID_KEY.test(key) || key.length > 80 || !value.label) {
            res.status(400).send("Mã chỉ gồm a-z, 0-9, dấu gạch ngang và tên không được trống.");
            return;
        }
        if (yield topic_category_model_1.default.exists({ key })) {
            res.status(409).send("Mã danh mục đã tồn tại.");
            return;
        }
        yield topic_category_model_1.default.create(Object.assign(Object.assign({ key }, value), { deleted: false }));
        res.redirect(base);
    }
    catch (err) {
        console.error("[topic-categories/create]", err);
        res.status(500).send("Không thể thêm danh mục");
    }
});
exports.createPost = createPost;
const edit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.isValidObjectId(req.params.id)) {
        res.status(404).send("Không tìm thấy danh mục");
        return;
    }
    const category = yield topic_category_model_1.default.findOne({ _id: req.params.id, deleted: false }).lean();
    if (!category) {
        res.status(404).send("Không tìm thấy danh mục");
        return;
    }
    res.render("admin/pages/topic-categories/form", { pageTitle: "Sửa danh mục chủ đề", category,
        action: `${base}/edit/${category._id}?_method=PATCH`, method: "POST" });
});
exports.edit = edit;
const editPatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.isValidObjectId(req.params.id)) {
        res.status(404).send("Không tìm thấy danh mục");
        return;
    }
    try {
        const category = yield topic_category_model_1.default.findOne({ _id: req.params.id, deleted: false });
        if (!category) {
            res.status(404).send("Không tìm thấy danh mục");
            return;
        }
        const value = fields(req);
        if (!value.label) {
            res.status(400).send("Tên danh mục không được trống.");
            return;
        }
        if (category.key === "khac" && value.status === "inactive") {
            res.status(400).send("Không thể ẩn nhóm mặc định.");
            return;
        }
        if (value.status === "inactive" && category.status === "active") {
            const count = yield topic_model_1.default.countDocuments({ categoryKey: category.key, deleted: false });
            if (count > 0) {
                res.status(409).send("Danh mục còn chủ đề. Hãy chuyển chủ đề sang nhóm khác trước khi ẩn.");
                return;
            }
        }
        yield topic_category_model_1.default.updateOne({ _id: category._id }, { $set: value });
        res.redirect(base);
    }
    catch (err) {
        console.error("[topic-categories/edit]", err);
        res.status(500).send("Không thể sửa danh mục");
    }
});
exports.editPatch = editPatch;
const deleteOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.isValidObjectId(req.params.id)) {
        res.status(404).send("Không tìm thấy danh mục");
        return;
    }
    try {
        const category = yield topic_category_model_1.default.findOne({ _id: req.params.id, deleted: false });
        if (!category) {
            res.status(404).send("Không tìm thấy danh mục");
            return;
        }
        if (category.key === "khac") {
            res.status(400).send("Không thể xóa danh mục mặc định.");
            return;
        }
        const count = yield topic_model_1.default.countDocuments({ deleted: false, categoryKey: category.key });
        if (count > 0) {
            res.status(409).send("Danh mục đang chứa chủ đề. Hãy chuyển chủ đề sang danh mục khác trước khi xóa.");
            return;
        }
        yield topic_category_model_1.default.updateOne({ _id: category._id }, { $set: { deleted: true } });
        res.redirect(base);
    }
    catch (err) {
        console.error("[topic-categories/delete]", err);
        res.status(500).send("Không thể xóa danh mục");
    }
});
exports.deleteOne = deleteOne;
