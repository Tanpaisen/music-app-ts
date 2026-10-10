import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào Tmu để nghe nhạc không giới hạn",
};

export default function LoginPage() {
  return <LoginForm />;
}
