"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "./AuthShell";

async function readMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  } catch { /* Backend trả HTML hoặc nội dung không phải JSON */ }
  return fallback;
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    setRegistered(new URLSearchParams(window.location.search).get("registered") === "1");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!response.ok) throw new Error(await readMessage(response, "Không thể đăng nhập. Vui lòng thử lại."));
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="login">
      <div className="auth-pill"><i className="bi bi-headphones" aria-hidden="true" /> KHÔNG GIAN CỦA BẠN</div>
      <h1 className="auth-title">Chào mừng<br /><span>trở lại.</span></h1>
      <p className="auth-description">Đăng nhập để tiếp tục playlist đang nghe dở và khám phá âm nhạc mới.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-email">Địa chỉ email</label>
          <div className="auth-input-wrap">
            <i className="bi bi-envelope" aria-hidden="true" />
            <input id="login-email" type="email" autoComplete="email" required maxLength={254}
              placeholder="ban@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
        </div>
        <div className="auth-field">
          <div className="auth-label-row"><label htmlFor="login-password">Mật khẩu</label><span className="auth-muted-link" title="Chức năng khôi phục mật khẩu sẽ được bổ sung">Quên mật khẩu?</span></div>
          <div className="auth-input-wrap">
            <i className="bi bi-lock" aria-hidden="true" />
            <input id="login-password" type={visible ? "text" : "password"} autoComplete="current-password"
              minLength={8} maxLength={128} required placeholder="Nhập mật khẩu" value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="button" className="auth-visibility" aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={visible} onClick={() => setVisible((state) => !state)}>
              <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
            </button>
          </div>
        </div>
        {registered && !error && <div className="auth-success" role="status"><i className="bi bi-check-circle" aria-hidden="true" />Đăng ký thành công! Bạn có thể đăng nhập.</div>}
        {error && <div className="auth-alert" role="alert"><i className="bi bi-exclamation-circle" aria-hidden="true" />{error}</div>}
        <button className="auth-primary" type="submit" disabled={loading}>
          {loading ? <><span className="auth-spinner" /> Đang đăng nhập...</> : <>Bắt đầu nghe nhạc <i className="bi bi-arrow-right" aria-hidden="true" /></>}
        </button>
      </form>
      <div className="auth-divider"><span /> HOẶC <span /></div>
      <p className="auth-switch">Bạn mới đến Tmus? <Link href="/auth/register">Tạo tài khoản miễn phí <i className="bi bi-arrow-right-short" aria-hidden="true" /></Link></p>
      <p className="auth-note"><i className="bi bi-shield-check" aria-hidden="true" /> Mật khẩu được truyền qua kết nối bảo mật HTTPS.</p>
    </AuthShell>
  );
}
