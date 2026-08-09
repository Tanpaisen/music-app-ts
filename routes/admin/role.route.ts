import { Router } from "express";

import * as controller from "../../controllers/admin/role.controller";

const router: Router = Router();

router.get("/", controller.index);

router.get("/create", controller.create);

router.get("/permissions", controller.permissions);

router.patch("/permissions", controller.permissionsPatch);

router.post("/create", controller.createPost);

export const roleRouter = router;