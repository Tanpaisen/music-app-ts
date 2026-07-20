import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import * as database from "./config/database";
import { routeMain } from "./routes/index.route";


dotenv.config();
database.connect();

const app: Express = express();

app.set('views', `${__dirname}/views`)
app.set('view engine', 'pug')

routeMain(app);

const PORT: string | number = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})