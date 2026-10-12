import { Router } from "express";
import * as controller from "../../controllers/admin/topic-category.controller";
import { checkPermission } from "../../middleware/admin/authentication.middleware";

// Tận dụng quyền topics_* hiện có để không phá bảng phân quyền của Admin.
export const topicCategoryRouter: Router = Router();
topicCategoryRouter.get("/", checkPermission("topics_view"), controller.index);
topicCategoryRouter.get("/create", checkPermission("topics_create"), controller.create);
topicCategoryRouter.post("/create", checkPermission("topics_create"), controller.createPost);
topicCategoryRouter.get("/edit/:id", checkPermission("topics_edit"), controller.edit);
topicCategoryRouter.patch("/edit/:id", checkPermission("topics_edit"), controller.editPatch);
topicCategoryRouter.delete("/delete/:id", checkPermission("topics_delete"), controller.deleteOne);
