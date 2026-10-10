import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập | Tmus",
  description: "Đăng nhập Tmus và tiếp tục hành trình âm nhạc của bạn.",
};

export default function LoginPage() {
  return <LoginForm />;
}
