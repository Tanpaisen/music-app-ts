import { Router } from "express";
import multer from "multer";
import * as controller from "../../controllers/admin/album.controller";
import { checkPermission } from "../../middleware/admin/authentication.middleware";
import * as uploadCloud from "../../middleware/admin/uploadCloud.middleware";

// Album là phần của danh mục nhạc: sử dụng quyền songs_* hiện có.
export const albumRouter: Router = Router();
const upload = multer({ limits: { fileSize: 6 * 1024 * 1024 } });
albumRouter.get("/", checkPermission("songs_view"), controller.index);
albumRouter.get("/create", checkPermission("songs_create"), controller.create);
albumRouter.post("/create", checkPermission("songs_create"), upload.fields([{ name: "avatar", maxCount: 1 }]), uploadCloud.uploadFields, controller.createPost);
albumRouter.get("/edit/:id", checkPermission("songs_edit"), controller.edit);
albumRouter.patch("/edit/:id", checkPermission("songs_edit"), upload.fields([{ name: "avatar", maxCount: 1 }]), uploadCloud.uploadFields, controller.editPatch);
albumRouter.delete("/delete/:id", checkPermission("songs_delete"), controller.deleteOne);
