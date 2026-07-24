import { Router } from "express";

import * as controller from "../controllers/song.controller";

const router: Router = Router();

router.get("/:songSlug", controller.list);

router.get("/detail/:songSlug", controller.detail);

router.patch("/like/:status/:songId", controller.like)

router.patch("/favorite/:status/:songId", controller.favorite)

export const songRouter = router;