import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true, collection: "users" }
);

// Giữ nguyên collection đang dùng. Không tự ý chuyển sang client_users
// nếu các tài khoản đăng ký trước đó nằm trong users.
const User = mongoose.model("User", userSchema, "users");
export default User;
