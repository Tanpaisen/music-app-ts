import { Router } from "express";
import multer from "multer"

import * as controller from "../../controllers/admin/topic.controller";
import * as uploadCloud from "../../middleware/uploadCloud.middleware"

const router: Router = Router();
const upload = multer()

router.get("/", controller.index);

router.get("/detail/:id", controller.detail);

router.patch("/change-status/:status/:id", controller.changeStatus);

router.get("/edit/:id", controller.edit);

router.patch("/edit/:id",
    upload.single('avatar'),
    uploadCloud.uploadSingle,
    controller.editPatch
);


export const topicRouter = router;