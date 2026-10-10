import { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký · VibeFlow",
  description: "Tạo tài khoản VibeFlow miễn phí để nghe nhạc không giới hạn",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
