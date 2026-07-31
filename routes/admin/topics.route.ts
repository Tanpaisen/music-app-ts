import { Router } from "express";

import * as controller from "../../controllers/admin/topic.controller";

const router: Router = Router();

router.get("/", controller.index);

router.get("/detail/:id", controller.detail);

router.patch("/change-status/:status/:id", controller.changeStatus);


export const topicRouter = router;