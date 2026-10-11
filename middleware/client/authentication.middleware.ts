import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import User from "../../models/user.model";
import "express-session";

declare module "express-session" {
  interface SessionData {
    clientUserId?: string;
  }
}

export const requireAuth = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const userId = req.session.clientUserId;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" });
      return;
    }
    const user = await User.findById(userId).select("_id fullName email");
    if (!user) {
      res.status(401).json({ code: "INVALID_SESSION", message: "Phiên đăng nhập không hợp lệ" });
      return;
    }
    res.locals.authUserId = String(user._id);
    res.locals.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};
