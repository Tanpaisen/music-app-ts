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

router.patch("/listen/:songSlug", controller.listenPatch);

router.get("/:songSlug", controller.list);

export const songRouter = router;
