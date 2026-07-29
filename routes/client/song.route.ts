import { Router } from "express";

import * as controller from "../../controllers/client/song.controller";

const router: Router = Router();

router.get("/favorite", controller.favorite)

router.get("/:songSlug", controller.list);

router.get("/detail/:songSlug", controller.detail);

router.patch("/like/:status/:songId", controller.like)

router.patch("/favorite/:status/:songId", controller.favoritePatch)

router.patch("/listen/:songSlug", controller.listenPatch)

export const songRouter = router;