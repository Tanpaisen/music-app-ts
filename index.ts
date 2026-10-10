import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import * as database from "./config/database";
import { routeMain } from "./routes/client/index.route";
import { syncSongsToMeili } from "./services/meilisearch.service";
import { routeAdmin } from "./routes/admin/index.route";
import path from "path";
import { systemConfig } from "./config/system";
import bodyParser from "body-parser";
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import cors from "cors";

const app: Express = express();

app.use(cors({
  origin: [
    "http://localhost:3001",
    process.env.FRONTEND_URL ?? "",
  ],
  credentials: true,
}));

app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));

// method-override
app.use(methodOverride('_method'));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// TinyMCE
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

// App Local Variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;

app.use(cookieParser('tanpaisen'));


app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "express-backend"
  });
});

const configureSession = async () => {
  const redisUrl = process.env.REDIS_URL;
  const isProduction = process.env.NODE_ENV === "production";

  const sessionSecret = process.env.SESSION_SECRET;

  if (isProduction && !sessionSecret) {
    throw new Error("Missing SESSION_SECRET");
  }

  let store: session.Store | undefined;

  if (redisUrl) {
    const redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on("error", (error) => {
      console.error("[Redis] Error:", error);
    });

    await redisClient.connect();

    console.log("[Redis] Connected successfully");

    store = new RedisStore({
      client: redisClient,
      prefix: "music:sess:",
    });
  } else if (isProduction) {
    throw new Error("Missing REDIS_URL");
  } else {
    console.log("[Session] Using local MemoryStore");
  }

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
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
    })
  );
};

const PORT: number = Number(process.env.PORT) || 3001;

const startServer = async () => {
  try {
    await database.connect();

    // Kết nối Redis và đăng ký middleware session
    await configureSession();

    // Đăng ký các route sau session middleware
    routeMain(app);
    routeAdmin(app);

    app.use((req: Request, res: Response) => {
      res.status(404).render('errors/404', {
        pageTitle: "Error",
      });
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });

    syncSongsToMeili().catch((error) => {
      console.error("Meilisearch sync failed:", error);
    });

  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
