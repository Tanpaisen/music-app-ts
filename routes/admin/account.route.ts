import { Router } from "express";

import * as controller from "../../controllers/admin/account.controller";

const router: Router = Router();

router.get("/", controller.index);


export const accountRouter = router;