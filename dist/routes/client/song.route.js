"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.songRouter = void 0;
const express_1 = require("express");
const controller = __importStar(require("../../controllers/client/song.controller"));
const authentication_middleware_1 = require("../../middleware/client/authentication.middleware");
const router = (0, express_1.Router)();
router.get("/favorite", authentication_middleware_1.requireAuth, controller.favorite);
router.get("/favorite/status/:songId", authentication_middleware_1.requireAuth, controller.favoriteState);
router.get("/like-state/:songId", authentication_middleware_1.requireAuth, controller.likeState);
router.get("/detail/:songSlug", controller.detail);
router.patch("/like/:status/:songId", authentication_middleware_1.requireAuth, controller.like);
router.patch("/favorite/:status/:songId", authentication_middleware_1.requireAuth, controller.favoritePatch);
router.patch("/listen/:songSlug", controller.listenPatch);
router.get("/:songSlug", controller.list);
exports.songRouter = router;
