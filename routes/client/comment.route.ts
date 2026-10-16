import { Router } from "express";
import { requireAuth } from "../../middleware/client/authentication.middleware";
import * as controller from "../../controllers/client/comment.controller";

const router: Router = Router();

// Người chưa đăng nhập vẫn được đọc bình luận và tổng số bình luận.
router.get("/song/:songId/count", controller.count);
router.get("/song/:songId", controller.list);

// Bắt buộc đăng nhập cho mọi thao tác ghi.
router.post("/song/:songId", requireAuth, controller.create);
router.patch("/:commentId", requireAuth, controller.update);
router.delete("/:commentId", requireAuth, controller.remove);

export const commentRouter = router;
