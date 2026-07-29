import { Router } from "express";

import * as controller from "../../controllers/admin/song.controller";

const router: Router = Router();

router.get("/", controller.index);


export const songRouter = router;