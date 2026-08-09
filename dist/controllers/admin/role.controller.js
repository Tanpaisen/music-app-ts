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
exports.createPost = exports.permissionsPatch = exports.permissions = exports.create = exports.index = void 0;
const role_model_1 = __importDefault(require("../../models/role.model"));
const system_1 = require("../../config/system");
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const roles = yield role_model_1.default.find({ deleted: false });
    res.render("admin/pages/roles/index", {
        pageTitle: "Trang nhóm quyền",
        roles: roles,
    });
});
exports.index = index;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render("admin/pages/roles/create", {
        pageTitle: "Trang tạo nhóm quyền mới",
    });
});
exports.create = create;
const permissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield role_model_1.default.find({
        deleted: false
    });
    res.render("admin/pages/roles/permissions", {
        pageTitle: "Trang phân quyền",
        data: data
    });
});
exports.permissions = permissions;
const permissionsPatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const permissions = req.body.permissions;
    for (const permission of permissions) {
        const roleID = permission.id;
        const permissionList = permission.permissions;
        yield role_model_1.default.updateOne({ _id: roleID }, {
            $set: { permissions: permissionList }
        });
    }
    res.json({
        location: `/${system_1.systemConfig.prefixAdmin}/roles/permissions`,
        permissions: permissions
    });
});
exports.permissionsPatch = permissionsPatch;
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {
        title: req.body.title,
        description: req.body.description,
    };
    const role = new role_model_1.default(data);
    yield role.save();
    res.redirect(`/${system_1.systemConfig.prefixAdmin}/roles`);
});
exports.createPost = createPost;
