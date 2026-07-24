import { Router } from "express";

import * as controller from "../controllers/song.controller";

const router: Router = Router();

router.get("/:songSlug", controller.list);

router.get("/detail/:songSlug", controller.detail);

router.get("/like/:status/:songId", controller.like)

export const songRouter = router;