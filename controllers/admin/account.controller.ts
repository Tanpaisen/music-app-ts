import { Request, Response } from "express";
import Account from "../../models/account.model";
import Role from "../../models/role.model";
import md5 from "md5";

import * as generate from "../../helpers/generate";
import { systemConfig } from "../../config/system";
//[GET] /admin/accounts
export const index = async (req: Request, res: Response) => {

    const accounts = await Account.find({
        deleted: false
    })
        .populate({
            path: "role_id",
            select: "title"
        })

    console.log(accounts)


    res.render("admin/pages/accounts/index", {
        pageTitle: "Trang quản lý tài khoản",
        records: accounts
    });
}
//[GET] /admin/accounts/create
export const create = async (req: Request, res: Response) => {
    const roles = await Role.find({ deleted: false });
    res.render("admin/pages/accounts/create", {
        pageTitle: "Thêm mới tài khoản",
        roles: roles
    });
}

//[POST] /admin/accounts/create
export const createPost = async (req: Request, res: Response) => {
    let token: string;
    let existToken: any;

    do {
        token = generate.generateRandomString(32);
        existToken = await Account.findOne({ token });
    } while (existToken);

    const data = {
        fullname: req.body.fullname,
        email: req.body.email,
        password: md5(req.body.password),
        token: token,
        phone: req.body.phone,
        avatar: req.body.avatar,
        role_id: req.body.role_id,
        status: req.body.status,
    }

    console.log(data)

    const account = new Account(data);
    await account.save();
    res.redirect(`/${systemConfig.prefixAdmin}/accounts`);
}

