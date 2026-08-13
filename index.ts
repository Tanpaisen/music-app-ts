import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import * as database from "./config/database";
import { routeMain } from "./routes/client/index.route"
import { syncSongsToMeili } from "./services/meilisearch.service"
import { routeAdmin } from "./routes/admin/index.route";
import path from "path";
import { systemConfig } from "./config/system";
import bodyParser from "body-parser";
import methodOverride from 'method-override'
import cookieParser from 'cookie-parser'
import session from 'express-session'

database.connect();

const app: Express = express();

app.set('views', `${__dirname}/views`)
app.set('view engine', 'pug')
app.use(express.static(__dirname + '/public'));

// method-override
app.use(methodOverride('_method'))

app.use(express.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

//TinyMCE
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));
//End TinyMCE

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


routeMain(app);
routeAdmin(app);

const PORT: string | number = process.env.PORT || 3000;

//meilisearch
// syncSongsToMeili()



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})