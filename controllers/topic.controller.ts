import { Request, Response } from "express";
import Topic from "../models/topic.model";

//[GET] /topics
export const listTopics = async (req: Request, res: Response) => {
    const topics = await Topic.find({ deleted: false }).lean();
  
    res.render("client/pages/topics/index", {
        topics,
        pageTitle: "Các chủ đề"
    });
}

