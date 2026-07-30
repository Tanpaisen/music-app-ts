import { Request, Response } from "express";
import Topic from "../../models/topic.model";


//[GET] /admin/topics
export const index = async (req: Request, res: Response) => {
    const topics = await Topic.find({
        deleted: false,
    })

    res.render('admin/pages/topics/index',{
        pageTitle: "Trang quản lý chủ đề",
        topics: topics
    })
}

//[GET] /admin/topics/detail/:id
export const detail = async (req: Request, res: Response) => {
    const id = req.params.id;

    const topic = await Topic.findOne({
        _id: id,
        deleted: false,
        status: "active"
    })

    res.render('admin/pages/topics/detail',{
        pageTitle: "Trang chi tiết chủ đề",
        topic: topic
    })
}