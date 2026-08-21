import { Router } from "express";
import * as controller from "../../controllers/client/home.controller";

const router = Router();

// GET /dashboard -> trả JSON cho Next.js dashboard consume
router.get("/", controller.dashboard);

export const homeRouter = router;
