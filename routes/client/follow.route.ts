import { Router } from "express";
import { requireAuth } from "../../middleware/client/authentication.middleware";
import * as controller from "../../controllers/client/follow.controller";

export const followRouter: Router = Router();

// Các API ở đây đều dựa trên clientUserId từ Redis Session.
followRouter.get("/me", requireAuth, controller.myFollowing);
followRouter.get("/singers/:singerId/status", requireAuth, controller.status);
followRouter.put("/singers/:singerId", requireAuth, controller.follow);
followRouter.delete("/singers/:singerId", requireAuth, controller.unfollow);
