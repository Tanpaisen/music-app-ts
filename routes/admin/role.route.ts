import { Router } from "express";

import * as controller from "../../controllers/admin/role.controller";

import * as authentication from '../../middleware/admin/authentication.middleware'

const router: Router = Router();

router.get("/", 
    authentication.checkPermission('roles_view'),
    controller.index
);

router.get("/create", controller.create);

router.get("/permissions", controller.permissions);

router.patch("/permissions", 
    authentication.checkPermission('roles-permissions_edit'),
    controller.permissionsPatch
);

router.post("/create", 
    authentication.checkPermission('accounts_create'),
    controller.createPost
);

export const roleRouter = router;