import { Request, Response } from "express";
import Account from "../../models/account.model";
import md5 from "md5";

//[GET] /admin/auth/login
export const login = async (req: Request, res: Response) => {

    res.render("admin/pages/auth/login", {
        pageTitle: "Đăng nhập"
    });
}
//[POST] /admin/auth/login
export const loginPost = async (req: Request, res: Response) => {
    req.body.password = md5(req.body.password)
    const { email, password } = req.body;

    const existUser = await Account.findOne({
        email: email,
        deleted: false
    });

    if (!existUser) {
        return res.render("admin/pages/auth/login", {
            pageTitle: "Đăng nhập",
            errorMessage: "Email không đúng."
        });
    }

    if(password !== existUser.password) {
        return res.json({
            code: 400,
            message: "Mật khẩu không đúng!"
        })
    }

    res.cookie('token',existUser.token)

    res.json({
        code: 200,
        message: "Đăng nhập thành công",
        token: existUser.token
    })
}

