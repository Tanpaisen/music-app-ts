import { Router } from "express";
import multer from "multer";
const upload = multer();

import * as controller from "../../controllers/admin/singer.controller";
import * as uploadCloudinary from "../../middleware/uploadCloud.middleware"

const router: Router = Router();

router.get("/", controller.index);

router.get("/create", controller.create);

router.post("/create",
    upload.single('avatar'),
    uploadCloudinary.uploadSingle,
    controller.createPost
);

export const singerRouter = router;