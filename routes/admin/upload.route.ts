import { Router } from "express";
import multer from 'multer';
import * as uploadCloud from '../../middleware/admin/uploadCloud.middleware'

const upload = multer()

import * as controller from "../../controllers/admin/upload.controller";

const router: Router = Router();

router.post("/", upload.single("file"),
    uploadCloud.uploadSingle, controller.index
);

export const uploadRouter = router;