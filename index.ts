import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import * as database from "./config/database";
import { routeMain } from "./routes/client/index.route"
import { syncSongsToMeili } from "./services/meilisearch.service"

database.connect();

const app: Express = express();

app.set('views', `${__dirname}/views`)
app.set('view engine', 'pug')
app.use(express.static(__dirname + '/public'));

routeMain(app);

const PORT: string | number = process.env.PORT || 3000;

//meilisearch
syncSongsToMeili()

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})