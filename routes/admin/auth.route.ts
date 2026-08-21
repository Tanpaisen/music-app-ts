import { Router } from "express";

import * as controller from "../../controllers/admin/auth.controller";
import * as validate from "../../validates/admin/auth.validate"
const router: Router = Router();

router.get("/login", controller.login);

router.get("/logout", controller.logout);

router.post("/login",
    validate.loginPost,
    controller.loginPost
);


export const authRouter = router;