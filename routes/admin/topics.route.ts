import { Router } from "express";
import multer from "multer"

import * as controller from "../../controllers/admin/topic.controller";
import * as uploadCloud from "../../middleware/admin/uploadCloud.middleware"
import * as authentication from '../../middleware/admin/authentication.middleware'

const router: Router = Router();
const upload = multer()

router.get("/", 
    authentication.checkPermission('topics_view'),
    controller.index
);

router.get("/detail/:id", controller.detail);

router.patch("/change-status/:status/:id", 
    authentication.checkPermission('topics_edit'),
    controller.changeStatus
);

router.get("/create", controller.create);

router.get("/edit/:id", controller.edit);

router.delete("/delete/:id", 
    authentication.checkPermission('topics_delete'),
    controller.deleteOne
);

router.patch("/edit/:id",
    authentication.checkPermission('topics_edit'),
    upload.single('avatar'),
    uploadCloud.uploadSingle,
    controller.editPatch
);

router.post("/create",
    authentication.checkPermission('topics_create'),
    upload.single('avatar'),
    uploadCloud.uploadSingle,
    controller.createPost
);


export const topicRouter = router;