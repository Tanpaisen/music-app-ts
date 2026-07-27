import { Router } from "express";

import * as controller from "../controllers/search.controller"

const router: Router = Router();

router.get("/result", controller.result);

export const searchRouter = router;