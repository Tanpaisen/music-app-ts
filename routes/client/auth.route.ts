import { Router, type Request, type Response } from "express";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import mongoose from "mongoose";
import ClientUser from "../../models/user.model";

const scrypt = promisify(scryptCallback);
export const clientAuthRouter = Router();

type UserSession = Request["session"] & { clientUserId?: string };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, salt, digest] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !digest || !/^[0-9a-f]{128}$/i.test(digest)) return false;
  const expected = Buffer.from(digest, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

clientAuthRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body ?? {};
    if (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 80 ||
      typeof email !== "string" || email.length > 254 || !emailPattern.test(email.trim()) ||
      typeof password !== "string" || password.length < 8 || password.length > 128) {
      res.status(400).json({ message: "Thông tin đăng ký không hợp lệ. Mật khẩu cần ít nhất 8 ký tự." });
      return;
    }
    const normalEmail = email.trim().toLowerCase();
    const exists = await ClientUser.exists({ email: normalEmail });
    if (exists) { res.status(409).json({ message: "Email này đã được sử dụng." }); return; }
    const passwordHash = await hashPassword(password);
    await ClientUser.create({ fullName: fullName.trim(), email: normalEmail, passwordHash });
    res.status(201).json({ message: "Đăng ký thành công. Bạn có thể đăng nhập." });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      res.status(409).json({ message: "Email này đã được sử dụng." }); return;
    }
    console.error("[client-auth] register failed", error);
    res.status(500).json({ message: "Máy chủ đang gặp sự cố. Vui lòng thử lại." });
  }
});

clientAuthRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string" || !emailPattern.test(email.trim()) || password.length > 128) {
      res.status(400).json({ message: "Email hoặc mật khẩu không hợp lệ." }); return;
    }
    const user = await ClientUser.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user || !(await verifyPassword(password, String(user.passwordHash)))) {
      res.status(401).json({ message: "Email hoặc mật khẩu không đúng." }); return;
    }
    // Regenerate session để ngăn session fixation.
    req.session.regenerate((err) => {
      if (err) { console.error("[client-auth] regenerate failed", err); res.status(500).json({ message: "Không thể tạo phiên đăng nhập." }); return; }
      (req.session as UserSession).clientUserId = String(user._id);
      req.session.save((saveError) => {
        if (saveError) { console.error("[client-auth] session save failed", saveError); res.status(500).json({ message: "Không thể lưu phiên đăng nhập." }); return; }
        res.status(200).json({ message: "Đăng nhập thành công", user: { id: String(user._id), fullName: user.fullName, email: user.email } });
      });
    });
  } catch (error) {
    console.error("[client-auth] login failed", error);
    res.status(500).json({ message: "Máy chủ đang gặp sự cố. Vui lòng thử lại." });
  }
});

clientAuthRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const userId = (req.session as UserSession).clientUserId;
    if (!userId || !mongoose.isValidObjectId(userId)) { res.status(401).json({ message: "Chưa đăng nhập" }); return; }
    const user = await ClientUser.findById(userId).select("fullName email");
    if (!user) { res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" }); return; }
    res.setHeader("Cache-Control", "no-store");
    res.json({ user: { id: String(user._id), fullName: user.fullName, email: user.email } });
  } catch (error) { console.error("[client-auth] me failed", error); res.status(500).json({ message: "Lỗi máy chủ" }); }
});

clientAuthRouter.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((error) => {
    if (error) { console.error("[client-auth] logout failed", error); res.status(500).json({ message: "Không thể đăng xuất" }); return; }
    res.clearCookie("music.sid", { path: "/" });
    res.json({ message: "Đã đăng xuất" });
  });
});
