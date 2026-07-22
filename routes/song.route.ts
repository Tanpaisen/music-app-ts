import { Router } from "express";

import * as controller from "../controllers/song.controller";

const router: Router = Router();

router.get("/:songSlug", controller.list);


export const songRouter = router;