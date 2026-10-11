"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwner = exports.requireSelf = void 0;
const requireSelf = (req, res, next) => {
    const currentUserId = res.locals.authUserId;
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
exports.requireSelf = requireSelf;
const requireOwner = (getOwnerId) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const userId = res.locals.authUserId;
            if (!userId) {
                res.status(401).json({
                    code: "UNAUTHORIZED",
                    message: "Vui lòng đăng nhập"
                });
                return;
            }
            const ownerId = yield getOwnerId(req);
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
        }
        catch (error) {
            next(error);
        }
    });
};
exports.requireOwner = requireOwner;
