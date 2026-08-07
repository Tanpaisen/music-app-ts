import { Request, Response } from "express";
import Account from "../../models/account.model";

//[GET] /admin/accounts
export const index = async (req: Request, res: Response) => {

    const accounts = await Account.find({ deleted: false })
    res.render("admin/pages/accounts/index", {
        pageTitle: "Trang quản lý tài khoản",
        records: accounts
    });
}

