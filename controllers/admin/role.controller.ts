import { Request, Response } from "express";
import Role from "../../models/role.model";
import { systemConfig } from "../../config/system";

//[GET] /admin/roles
export const index = async (req: Request, res: Response) => {
    const roles = await Role.find({ deleted: false });
    
    res.render("admin/pages/roles/index", {
        pageTitle: "Trang nhóm quyền",
        roles: roles,
    });
}

//[GET] /admin/roles/create
export const create = async (req: Request, res: Response) => {
    res.render("admin/pages/roles/create", {
        pageTitle: "Trang tạo nhóm quyền mới",
    });
}

//[POST] /admin/roles/create
export const createPost = async (req: Request, res: Response) => {
    const data = {
        title: req.body.title,
        description: req.body.description,
    }

    const role = new Role(data);
    await role.save();
    res.redirect(`/${systemConfig.prefixAdmin}/roles`);
}

