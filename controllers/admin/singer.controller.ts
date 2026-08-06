import { Request, Response } from "express";
import Singer from "../../models/singer.model";
import { systemConfig } from "../../config/system";

//[GET] /admin/singers
export const index = async (req: Request, res: Response) => {

    const singers = await Singer.find({
        deleted: false,
    })
    res.render("admin/pages/singers/index", {
        pageTitle: "Trang tổng quan",
        singers: singers
    });
}

//[GET] /admin/singers/create
export const create = async (req: Request, res: Response) => {
    res.render("admin/pages/singers/create", {
        pageTitle: "Thêm mới ca sĩ"
    });
}

//[POST] /admin/singers/create
export const createPost = async (req: Request, res: Response) => {
    const { fullName, avatar, status } = req.body;
    
    const singer = new Singer({
        fullName: fullName,
        avatar: avatar,
        status: status
    });
    await singer.save();

    const backURL = req.header('Referer') || `/${systemConfig.prefixAdmin}/singers`;
    res.redirect(backURL);
}

