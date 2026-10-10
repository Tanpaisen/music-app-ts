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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientAuthRouter = void 0;
const express_1 = require("express");
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const scrypt = (0, node_util_1.promisify)(node_crypto_1.scrypt);
exports.clientAuthRouter = (0, express_1.Router)();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        const salt = (0, node_crypto_1.randomBytes)(16).toString("hex");
        const key = (yield scrypt(password, salt, 64));
        return `scrypt:${salt}:${key.toString("hex")}`;
    });
}
function verifyPassword(password, encoded) {
    return __awaiter(this, void 0, void 0, function* () {
        const [algorithm, salt, digest] = encoded.split(":");
        if (algorithm !== "scrypt" || !salt || !digest || !/^[0-9a-f]{128}$/i.test(digest))
            return false;
        const expected = Buffer.from(digest, "hex");
        const actual = (yield scrypt(password, salt, expected.length));
        return actual.length === expected.length && (0, node_crypto_1.timingSafeEqual)(actual, expected);
    });
}
exports.clientAuthRouter.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { fullName, email, password } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 80 ||
            typeof email !== "string" || email.length > 254 || !emailPattern.test(email.trim()) ||
            typeof password !== "string" || password.length < 8 || password.length > 128) {
            res.status(400).json({ message: "Thông tin đăng ký không hợp lệ. Mật khẩu cần ít nhất 8 ký tự." });
            return;
        }
        const normalEmail = email.trim().toLowerCase();
        const exists = yield user_model_1.default.exists({ email: normalEmail });
        if (exists) {
            res.status(409).json({ message: "Email này đã được sử dụng." });
            return;
        }
        const passwordHash = yield hashPassword(password);
        yield user_model_1.default.create({ fullName: fullName.trim(), email: normalEmail, passwordHash });
        res.status(201).json({ message: "Đăng ký thành công. Bạn có thể đăng nhập." });
    }
    catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === 11000) {
            res.status(409).json({ message: "Email này đã được sử dụng." });
            return;
        }
        console.error("[client-auth] register failed", error);
        res.status(500).json({ message: "Máy chủ đang gặp sự cố. Vui lòng thử lại." });
    }
}));
exports.clientAuthRouter.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email, password } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (typeof email !== "string" || typeof password !== "string" || !emailPattern.test(email.trim()) || password.length > 128) {
            res.status(400).json({ message: "Email hoặc mật khẩu không hợp lệ." });
            return;
        }
        const user = yield user_model_1.default.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
        if (!user || !(yield verifyPassword(password, String(user.passwordHash)))) {
            res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
            return;
        }
        req.session.regenerate((err) => {
            if (err) {
                console.error("[client-auth] regenerate failed", err);
                res.status(500).json({ message: "Không thể tạo phiên đăng nhập." });
                return;
            }
            req.session.clientUserId = String(user._id);
            req.session.save((saveError) => {
                if (saveError) {
                    console.error("[client-auth] session save failed", saveError);
                    res.status(500).json({ message: "Không thể lưu phiên đăng nhập." });
                    return;
                }
                res.status(200).json({ message: "Đăng nhập thành công", user: { id: String(user._id), fullName: user.fullName, email: user.email } });
            });
        });
    }
    catch (error) {
        console.error("[client-auth] login failed", error);
        res.status(500).json({ message: "Máy chủ đang gặp sự cố. Vui lòng thử lại." });
    }
}));
exports.clientAuthRouter.get("/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.session.clientUserId;
        if (!userId || !mongoose_1.default.isValidObjectId(userId)) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const user = yield user_model_1.default.findById(userId).select("fullName email");
        if (!user) {
            res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" });
            return;
        }
        res.setHeader("Cache-Control", "no-store");
        res.json({ user: { id: String(user._id), fullName: user.fullName, email: user.email } });
    }
    catch (error) {
        console.error("[client-auth] me failed", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
}));
exports.clientAuthRouter.post("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("[client-auth] logout failed", error);
            res.status(500).json({ message: "Không thể đăng xuất" });
            return;
        }
        res.clearCookie("music.sid", { path: "/" });
        res.json({ message: "Đã đăng xuất" });
    });
});
