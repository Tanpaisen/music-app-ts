import { Router } from "express";
import * as controller from "../../controllers/client/listening.controller";

export const listeningRouter: Router = Router();
listeningRouter.post("/start", controller.start);
listeningRouter.post("/complete", controller.complete);
listeningRouter.get("/next", controller.next);
listeningRouter.get("/me/top", controller.myTop);
