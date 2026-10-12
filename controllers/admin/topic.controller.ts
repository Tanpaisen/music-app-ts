import { Request, Response } from "express";
import Topic from "../../models/topic.model";
import { DEFAULT_TOPIC_CATEGORY } from "../../config/topic-categories";
import { categoryExists, listCategories } from "../../services/topic-category.service";
import { systemConfig } from "../../config/system";


//[GET] /admin/topics
export const index = async (req: Request, res: Response) => {
    const categories = await listCategories();
    const topics = await Topic.find({
        deleted: false,
    })

    res.render('admin/pages/topics/index', {
        pageTitle: "Trang quản lý chủ đề",
        topics: topics,
        categoryLabels: Object.fromEntries(categories.map(c => [c.key, c.label])),
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
        topic: topic,
        topicCategories: await listCategories(true),
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
        pageTitle: "Trang chỉnh sửa chủ đề",
        topic: topic,
        topicCategories: await listCategories(true),
    })
}

//[GET] /admin/topics/create
export const create = async (req: Request, res: Response) => {

    res.render('admin/pages/topics/create', {
        pageTitle: "Trang thêm mới chủ đề",
        topicCategories: await listCategories(true),
    })
}

//[POST] /admin/topics/create
export const createPost = async (req: Request, res: Response) => {

    const categoryKey = String(req.body.categoryKey || DEFAULT_TOPIC_CATEGORY);
    if (!await categoryExists(categoryKey)) { res.status(400).send("Danh mục không hợp lệ"); return; }
    const data = {
        title: req.body.title,
        description: req.body.description,
        avatar: req.body.avatar,
        status: req.body.status === "active" ? "active" : "inactive",
        categoryKey,
        featured: req.body.featured === "on",
        sortOrder: Math.max(0, Math.min(9999, Number(req.body.sortOrder) || 0)),
    }

    const topic = new Topic(data)
    await topic.save()

    const backUrl = req.get("Referer") || `/${systemConfig.prefixAdmin}/topics`;
    res.redirect(backUrl);
}

//[PATCH] /admin/topics/edit/:id
export const editPatch = async (req: Request, res: Response) => {

    const id = req.params.id;

    if (!await categoryExists(String(req.body.categoryKey || ""))) {
        res.status(400).send("Danh mục chủ đề không hợp lệ");
        return;
    }
    const changes = {
        title: String(req.body.title || "").trim(),
        description: String(req.body.description || ""),
        // Middleware upload của dự án điền URL vào req.body.avatar nếu có ảnh mới.
        ...(req.body.avatar ? { avatar: String(req.body.avatar) } : {}),
        status: req.body.status === "active" ? "active" : "inactive",
        categoryKey: req.body.categoryKey,
        featured: req.body.featured === "on",
        sortOrder: Math.max(0, Math.min(9999, Number(req.body.sortOrder) || 0)),
    };
    if (!changes.title) { res.status(400).send("Vui lòng nhập tiêu đề"); return; }
    await Topic.updateOne({
        _id: id,
        deleted: false
    }, { $set: changes })
    const backUrl = req.get("Referer") || `/${systemConfig.prefixAdmin}/topics`;
    res.redirect(backUrl);
}

//[DELETE] /admin/topics/delete/:id
export const deleteOne = async (req: Request, res: Response) => {

    await Topic.updateOne({
        _id: req.params.id,
        deleted: false
    },
        {
            deleted: true
        })

    const backUrl = req.get("Referer") || `/${systemConfig.prefixAdmin}/topics`;
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
    const backUrl = req.get("Referer") || `/${systemConfig.prefixAdmin}/topics`;
    res.redirect(backUrl);
}