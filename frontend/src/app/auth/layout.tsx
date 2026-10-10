// Layout riêng cho tất cả trang /auth/*
// Không kế thừa Sidebar/TopBar/PlayerBar từ root layout
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
