import { Router } from "express";
import * as controller from "../../controllers/client/album.controller";
export const albumRouter: Router = Router();
albumRouter.get("/", controller.index);
albumRouter.get("/:albumSlug", controller.detail);
