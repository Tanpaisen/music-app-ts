import { Router } from "express";
import * as controller from "../../controllers/client/song.controller";
import { requireAuth } from "../../middleware/client/authentication.middleware";

const router: Router = Router();

router.get("/favorite", requireAuth, controller.favorite);

router.get("/favorite/status/:songId", requireAuth, controller.favoriteState);

router.get("/like-state/:songId", requireAuth, controller.likeState);

router.get("/detail/:songSlug", controller.detail);

router.patch("/like/:status/:songId", requireAuth, controller.like);

router.patch("/favorite/:status/:songId", requireAuth, controller.favoritePatch);

// Ngừng endpoint cũ tăng lượt nghe tức thì. API mới yêu cầu phiên phát >= 30 giây.
router.patch("/listen/:songSlug", (_req, res) => {
  res.status(410).json({ code: "USE_LISTENING_API", message: "Sử dụng /api/listening/start và /api/listening/complete" });
});

router.get("/:songSlug", controller.list);

export const songRouter = router;
