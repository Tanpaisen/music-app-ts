import { Router } from "express";

import * as controller from "../../controllers/admin/singer.controller";

const router: Router = Router();

router.get("/", controller.index);


export const singerRouter = router;