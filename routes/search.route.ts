import { Router } from "express";

import * as controller from "../controllers/search.controller"

const router: Router = Router();

router.get("/:typeSearch", controller.type);

export const searchRouter = router;