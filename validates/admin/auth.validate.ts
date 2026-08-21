import { NextFunction, Request, Response } from "express";
import { systemConfig } from "../../config/system";

export const loginPost = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.email == "") {
        // req.flash('error', 'Vui lòng nhập email!');
        const back = req.get('referer') || `/${systemConfig.prefixAdmin}/auth/login`
        res.redirect(back)
        return;
    }

    if (req.body.password == "") {
        // req.flash('error', 'Vui lòng nhập mật khẩu!');
        res.redirect('back')
        return;
    }

    next();
}