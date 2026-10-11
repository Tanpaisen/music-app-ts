import { Request, Response, NextFunction } from "express";

export const requireSelf = (req: Request, res: Response, next: NextFunction): void => {
  const currentUserId = res.locals.authUserId as string | undefined;
  if (!currentUserId) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" });
    return;
  }
  if (req.params.userId !== currentUserId) {
    res.status(403).json({ code: "FORBIDDEN", message: "Không có quyền thao tác tài khoản này" });
    return;
  }
  next();
};


type OwnerLookup = (
  req: Request
) => Promise<string | null>;

export const requireOwner = (
  getOwnerId: OwnerLookup
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = res.locals.authUserId as string | undefined;

      if (!userId) {
        res.status(401).json({
          code: "UNAUTHORIZED",
          message: "Vui lòng đăng nhập"
        });
        return;
      }

      const ownerId = await getOwnerId(req);

      if (!ownerId) {
        res.status(404).json({
          code: "NOT_FOUND",
          message: "Không tìm thấy dữ liệu"
        });
        return;
      }

      if (ownerId !== userId) {
        res.status(403).json({
          code: "FORBIDDEN",
          message: "Bạn không có quyền thao tác dữ liệu này"
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
