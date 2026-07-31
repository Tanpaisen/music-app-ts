import { Router } from "express";
import multer from "multer"

import * as controller from "../../controllers/admin/topic.controller";
import * as uploadCloud from "../../middleware/uploadCloud.middleware"

const router: Router = Router();
const upload = multer()

router.get("/", controller.index);

router.get("/detail/:id", controller.detail);

router.patch("/change-status/:status/:id", controller.changeStatus);

router.get("/create", controller.create);

router.get("/edit/:id", controller.edit);

router.delete("/delete/:id", controller.deleteOne);

router.patch("/edit/:id",
    upload.single('avatar'),
    uploadCloud.uploadSingle,
    controller.editPatch
);

router.post("/create",
    upload.single('avatar'),
    uploadCloud.uploadSingle,
    controller.createPost
);


export const topicRouter = router;