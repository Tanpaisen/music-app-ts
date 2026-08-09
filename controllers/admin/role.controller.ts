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

//[GET] /admin/roles/permissions
export const permissions = async (req: Request, res: Response) => {
    const data = await Role.find({
        deleted: false
    })
    res.render("admin/pages/roles/permissions", {
        pageTitle: "Trang phân quyền",
        data: data
    });
}

//[PATCH] /admin/roles/permissions
export const permissionsPatch = async (req: Request, res: Response) => {
    const permissions = req.body.permissions;

    for (const permission of permissions) {
        const roleID = permission.id;
        const permissionList = permission.permissions;

        await Role.updateOne({ _id: roleID },
            {
                $set: { permissions: permissionList }
            });
    }
    res.json({
        location: `/${systemConfig.prefixAdmin}/roles/permissions`,
        permissions: permissions
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

