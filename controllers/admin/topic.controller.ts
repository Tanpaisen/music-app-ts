import { Request, Response } from "express";
import Topic from "../../models/topic.model";
import { systemConfig } from "../../config/system";


//[GET] /admin/topics
export const index = async (req: Request, res: Response) => {
    const topics = await Topic.find({
        deleted: false,
    })

    res.render('admin/pages/topics/index', {
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

    res.render('admin/pages/topics/detail', {
        pageTitle: "Trang chi tiết chủ đề",
        topic: topic
    })
}

//[GET] /admin/topics/edit/:id
export const edit = async (req: Request, res: Response) => {
    const id = req.params.id;

    const topic = await Topic.findOne({
        _id: id,
        deleted: false,
    })

    res.render('admin/pages/topics/edit', {
        pageTitle: "Trang chi tiết chủ đề",
        topic: topic
    })
}

//[PATCH] /admin/topics/edit/:id
export const editPatch = async (req: Request, res: Response) => {

    const id = req.params.id;

    await Topic.updateOne({
        _id: id,
        deleted: false
    }, req.body
    )
    const backUrl = req.get("Referer") || `${systemConfig.prefixAdmin}/products`;
    res.redirect(backUrl);
}
//[PATCH] /admin/topics/change-status/:status/:id
export const changeStatus = async (req: Request, res: Response) => {

    const { status, id } = req.params
    await Topic.updateOne({
        _id: id,
        deleted: false
    }, {
        status: status
    })
    const backUrl = req.get("Referer") || `${systemConfig.prefixAdmin}/products`;
    res.redirect(backUrl);
}