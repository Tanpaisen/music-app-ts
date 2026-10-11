import { Router } from "express";
import multer from "multer"

import * as controller from "../../controllers/admin/song.controller";
import * as uploadCloud from "../../middleware/admin/uploadCloud.middleware"
import * as authentication from '../../middleware/admin/authentication.middleware'

const router: Router = Router();

const upload = multer()

router.get("/", 
    authentication.checkPermission('songs_view'),
    controller.index
);

router.get("/create", controller.create);

router.get("/edit/:id", controller.edit);

router.post("/create",
    authentication.checkPermission('songs_create'),
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'audio', maxCount: 1 }
    ]),
    uploadCloud.uploadFields,
    controller.createPost
);

router.patch("/edit/:id",
    authentication.checkPermission('songs_edit'),
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'audio', maxCount: 1 }
    ]),
    uploadCloud.uploadFields,
    controller.editPatch
);

export const songRouter = router;