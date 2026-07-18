import express, { Express, Request, Response } from "express";

const app: Express = express();

app.get("/", (req: Request, res: Response) => {
    res.send("Hello, World!");
});

const PORT: string | number = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})