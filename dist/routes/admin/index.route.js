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
exports.routeAdmin = void 0;
const dashboard_route_1 = require("./dashboard.route");
const system_1 = require("../../config/system");
const topics_route_1 = require("./topics.route");
const song_route_1 = require("./song.route");
const upload_route_1 = require("./upload.route");
const singer_route_1 = require("./singer.route");
const role_route_1 = require("./role.route");
const account_route_1 = require("./account.route");
const auth_route_1 = require("./auth.route");
const authMiddleware = __importStar(require("../../middleware/authentication.middleware"));
const routeAdmin = (app) => {
    const path = system_1.systemConfig.prefixAdmin;
    app.use(`/${path}/dashboard`, authMiddleware.requireAuth, dashboard_route_1.dashboardRouter);
    app.use(`/${path}/topics`, authMiddleware.requireAuth, topics_route_1.topicRouter);
    app.use(`/${path}/songs`, authMiddleware.requireAuth, song_route_1.songRouter);
    app.use(`/${path}/upload`, authMiddleware.requireAuth, upload_route_1.uploadRouter);
    app.use(`/${path}/singers`, authMiddleware.requireAuth, singer_route_1.singerRouter);
    app.use(`/${path}/accounts`, authMiddleware.requireAuth, account_route_1.accountRouter);
    app.use(`/${path}/roles`, authMiddleware.requireAuth, role_route_1.roleRouter);
    app.use(`/${path}/auth`, auth_route_1.authRouter);
};
exports.routeAdmin = routeAdmin;
