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
app.use(
  session({
    secret: 'tanpaisen',
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "express-backend"
  });
});

routeMain(app);
routeAdmin(app);

app.use((req: Request, res: Response) => {
  res.status(404).render('errors/404', {
    pageTitle: "Error",
  });
});

const PORT: number = Number(process.env.PORT) || 3001;

// Kết nối CSDL trước -> Rồi mới chạy Sync Meilisearch & Khởi chạy Server
const startServer = async () => {
  try {
    await database.connect();

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