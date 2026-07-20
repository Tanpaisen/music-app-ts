import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import * as database from "./config/database";
import Topic from "./models/topic.model";


dotenv.config();
database.connect();

const app: Express = express();

app.set('views', `${__dirname}/views`)
app.set('view engine', 'pug')

app.get("/topics", async (req: Request, res: Response) => {
    const topics = await Topic.find({ deleted: false });
    console.log(topics);
    res.render("client/pages/topics/index", { topics });
});

const PORT: string | number = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})