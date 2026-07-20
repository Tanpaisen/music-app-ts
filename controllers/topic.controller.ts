import { Request, Response } from "express";
import Topic from "../models/topic.model";

export const listTopics = async (req: Request, res: Response) => {
    const topics = await Topic.find({ deleted: false });
    console.log(topics);                   
    res.render("client/pages/topics/index", { topics });
}                