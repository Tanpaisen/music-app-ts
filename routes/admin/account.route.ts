import { Router } from "express";
import multer from "multer";
const upload = multer();

import * as controller from "../../controllers/admin/account.controller";
import *as uploadToCloud from "../../middleware/uploadCloud.middleware";

const router: Router = Router();

router.get("/", controller.index);

router.get("/create", controller.create);

router.post("/create",
    upload.single('avatar'),
    uploadToCloud.uploadSingle,
    controller.createPost);


export const accountRouter = router;