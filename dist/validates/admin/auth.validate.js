"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginPost = void 0;
const system_1 = require("../../config/system");
const loginPost = (req, res, next) => {
    if (req.body.email == "") {
        const back = req.get('referer') || `/${system_1.systemConfig.prefixAdmin}/auth/login`;
        res.redirect(back);
        return;
    }
    if (req.body.password == "") {
        res.redirect('back');
        return;
    }
    next();
};
exports.loginPost = loginPost;
