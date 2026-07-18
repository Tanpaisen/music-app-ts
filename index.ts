import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import * as database from "./config/database";

dotenv.config();
database.connect();

const app: Express = express();

app.get("/", (req: Request, res: Response) => {
    res.send("Hello, World!");
});

const PORT: string | number = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})