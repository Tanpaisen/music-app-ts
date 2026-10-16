import { Router } from "express";
import { requireAuth } from "../../middleware/client/authentication.middleware";
import * as controller from "../../controllers/client/playlist.controller";

const router: Router = Router();

// Bắt buộc đăng nhập với TẤT CẢ endpoint playlist.
router.use(requireAuth);
router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:playlistId", controller.detail);
router.patch("/:playlistId", controller.update);
router.delete("/:playlistId", controller.remove);
router.put("/:playlistId/songs/:songId", controller.addSong);
router.delete("/:playlistId/songs/:songId", controller.removeSong);

export const playlistRouter = router;
