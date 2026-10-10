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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const database = __importStar(require("./config/database"));
const index_route_1 = require("./routes/client/index.route");
const meilisearch_service_1 = require("./services/meilisearch.service");
const index_route_2 = require("./routes/admin/index.route");
const path_1 = __importDefault(require("path"));
const system_1 = require("./config/system");
const body_parser_1 = __importDefault(require("body-parser"));
const method_override_1 = __importDefault(require("method-override"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const redis_1 = require("redis");
const connect_redis_1 = require("connect-redis");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3001",
        (_a = process.env.FRONTEND_URL) !== null && _a !== void 0 ? _a : "",
    ],
    credentials: true,
}));
app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');
app.use(express_1.default.static(__dirname + '/public'));
app.use((0, method_override_1.default)('_method'));
app.use(express_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use('/tinymce', express_1.default.static(path_1.default.join(__dirname, 'node_modules', 'tinymce')));
app.locals.prefixAdmin = system_1.systemConfig.prefixAdmin;
app.use((0, cookie_parser_1.default)('tanpaisen'));
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "express-backend"
    });
});
const configureSession = () => __awaiter(void 0, void 0, void 0, function* () {
    const redisUrl = process.env.REDIS_URL;
    const isProduction = process.env.NODE_ENV === "production";
    const sessionSecret = process.env.SESSION_SECRET;
    if (isProduction && !sessionSecret) {
        throw new Error("Missing SESSION_SECRET");
    }
    let store;
    if (redisUrl) {
        const redisClient = (0, redis_1.createClient)({
            url: redisUrl,
        });
        redisClient.on("error", (error) => {
            console.error("[Redis] Error:", error);
        });
        yield redisClient.connect();
        console.log("[Redis] Connected successfully");
        store = new connect_redis_1.RedisStore({
            client: redisClient,
            prefix: "music:sess:",
        });
    }
    else if (isProduction) {
        throw new Error("Missing REDIS_URL");
    }
    else {
        console.log("[Session] Using local MemoryStore");
    }
    if (isProduction) {
        app.set("trust proxy", 1);
    }
    app.use((0, express_session_1.default)({
        store,
        name: "music.sid",
        secret: sessionSecret || "local-dev-only-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000,
        },
    }));
});
const PORT = Number(process.env.PORT) || 3001;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database.connect();
        yield configureSession();
        (0, index_route_1.routeMain)(app);
        (0, index_route_2.routeAdmin)(app);
        app.use((req, res) => {
            res.status(404).render('errors/404', {
                pageTitle: "Error",
            });
        });
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on port ${PORT}`);
        });
        (0, meilisearch_service_1.syncSongsToMeili)().catch((error) => {
            console.error("Meilisearch sync failed:", error);
        });
    }
    catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
});
startServer();
