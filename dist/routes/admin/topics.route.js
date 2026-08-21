"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.topicRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const controller = __importStar(require("../../controllers/admin/topic.controller"));
const uploadCloud = __importStar(require("../../middleware/uploadCloud.middleware"));
const authentication = __importStar(require("../../middleware/authentication.middleware"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)();
router.get("/", authentication.checkPermission('topics_view'), controller.index);
router.get("/detail/:id", controller.detail);
router.patch("/change-status/:status/:id", authentication.checkPermission('topics_edit'), controller.changeStatus);
router.get("/create", controller.create);
router.get("/edit/:id", controller.edit);
router.delete("/delete/:id", authentication.checkPermission('topics_delete'), controller.deleteOne);
router.patch("/edit/:id", authentication.checkPermission('topics_edit'), upload.single('avatar'), uploadCloud.uploadSingle, controller.editPatch);
router.post("/create", authentication.checkPermission('topics_create'), upload.single('avatar'), uploadCloud.uploadSingle, controller.createPost);
exports.topicRouter = router;
