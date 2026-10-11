import { Router } from "express";
import * as controller from "../../controllers/client/artist.controller";

export const artistRouter: Router = Router();

// Thông tin nghệ sĩ là công khai; API Follow vẫn sử dụng requireAuth riêng.
artistRouter.get("/:artistKey", controller.detail);
