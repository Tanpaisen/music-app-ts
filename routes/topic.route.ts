import { Request, Response, Router } from "express";
import Topic from "../models/topic.model";

const router: Router = Router();
router.get("/", async (req: Request, res: Response) => {
    const topics = await Topic.find({ deleted: false });
    console.log(topics);
    res.render("client/pages/topics/index", { topics });
});

export const topicRouter = router;