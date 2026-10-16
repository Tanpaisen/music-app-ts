import { Router } from "express";
import { requireAuth } from "../../middleware/client/authentication.middleware";
import * as controller from "../../controllers/client/catalog.controller";

export const catalogRouter: Router = Router();

// Công khai, không yêu cầu đăng nhập
catalogRouter.get("/artists", controller.artists);
catalogRouter.get("/topics", controller.topics);
catalogRouter.get("/topics/groups", controller.topicGroups);
catalogRouter.get("/topics/:topicSlug", controller.topicDetail);

// Chỉ lấy danh sách liked thuộc userId của phiên đăng nhập
catalogRouter.get("/liked", requireAuth, controller.liked);
