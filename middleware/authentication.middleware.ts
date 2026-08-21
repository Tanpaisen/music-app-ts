import { NextFunction, Request, Response } from 'express';
import { systemConfig } from '../config/system'
import Account from '../models/account.model';
import Role from '../models/role.model';


export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies.token) {
        res.redirect(`/${systemConfig.prefixAdmin}/auth/login`)
    }
    else {
        let user = await Account.findOne({ token: req.cookies.token }).select("-password").lean();
        if (!user) {
            res.redirect(`${systemConfig.prefixAdmin}/auth/login`)
        }

        const role = await Role.findOne({
            _id: user?.role_id,
            deleted: false
        })

        res.locals.user = user;
        res.locals.role = role;
        next();
    }

}

export const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = res.locals.role;
    if (role && role.permissions.includes(permission)) {
      return next();
    }
    return res.status(403).render('errors/403', {
      pageTitle: "Forbidden",
    });
  };
};