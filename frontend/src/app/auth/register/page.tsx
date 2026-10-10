import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký | Tmus",
  description: "Tạo tài khoản Tmus để tận hưởng âm nhạc theo cách của bạn.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
