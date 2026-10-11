import { Router } from "express";
import multer from "multer";
const upload = multer();

import * as controller from "../../controllers/admin/singer.controller";
import * as uploadCloudinary from "../../middleware/admin/uploadCloud.middleware"
import * as authentication from '../../middleware/admin/authentication.middleware'

const router: Router = Router();

router.get("/", 
    authentication.checkPermission('singers_view'),
    controller.index
);

router.get("/create", controller.create);

router.post("/create",
    authentication.checkPermission('singers_edit'),
    upload.single('avatar'),
    uploadCloudinary.uploadSingle,
    controller.createPost
);

export const singerRouter = router;