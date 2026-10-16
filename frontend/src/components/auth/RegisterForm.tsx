"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "./AuthShell";

function passwordScore(value: string): number {
  if (!value) return 0;
  return [value.length >= 8, /[a-z]/.test(value) && /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
}

async function readMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") return data.message;
  } catch { /* Nội dung lỗi không phải JSON */ }
  return "Không thể tạo tài khoản. Vui lòng thử lại.";
}

export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const score = passwordScore(password);
  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (fullName.trim().length < 2) { setError("Họ tên cần có ít nhất 2 ký tự."); return; }
    if (password.length < 8) { setError("Mật khẩu cần có ít nhất 8 ký tự."); return; }
    if (password !== confirmPassword) { setError("Mật khẩu xác nhận chưa khớp."); return; }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim().toLowerCase(), password }),
      });
      if (!response.ok) throw new Error(await readMessage(response));
      router.push("/auth/login?registered=1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="register">
      <div className="auth-pill"><i className="bi bi-stars" aria-hidden="true" /> BẮT ĐẦU HÀNH TRÌNH ÂM NHẠC</div>
      <h1 className="auth-title">Tạo chất riêng.<br /><span>Nghe chất riêng.</span></h1>
      <p className="auth-description">Tạo tài khoản miễn phí để giữ lại những bản nhạc khiến bạn rung động.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="register-name">Họ và tên</label>
          <div className="auth-input-wrap"><i className="bi bi-person" aria-hidden="true" />
            <input id="register-name" type="text" autoComplete="name" minLength={2} maxLength={80} required
              placeholder="Tên của bạn" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="register-email">Địa chỉ email</label>
          <div className="auth-input-wrap"><i className="bi bi-envelope" aria-hidden="true" />
            <input id="register-email" type="email" autoComplete="email" maxLength={254} required
              placeholder="ban@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="register-password">Mật khẩu</label>
          <div className="auth-input-wrap"><i className="bi bi-lock" aria-hidden="true" />
            <input id="register-password" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128}
              placeholder="Ít nhất 8 ký tự" value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="button" className="auth-visibility" aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={visible} onClick={() => setVisible(!visible)}>
              <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
            </button>
          </div>
          {password.length > 0 && <div className="auth-password-hint">
            <div className="auth-strength" aria-label={`Độ mạnh mật khẩu: ${score} trên 4`}>
              {[1, 2, 3, 4].map((bar) => <span key={bar} className={bar <= score ? "active" : ""} />)}
            </div>
            <span>{score <= 1 ? "Nên đặt mạnh hơn" : score <= 2 ? "Trung bình" : score === 3 ? "Khá mạnh" : "Mạnh"}</span>
          </div>}
        </div>
        <div className="auth-field">
          <label htmlFor="register-confirm">Xác nhận mật khẩu</label>
          <div className={`auth-input-wrap ${mismatch ? "auth-input-error" : ""}`}><i className="bi bi-shield-lock" aria-hidden="true" />
            <input id="register-confirm" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8}
              placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} aria-invalid={mismatch} />
          </div>
          {mismatch && <small className="auth-field-error">Hai mật khẩu chưa trùng nhau.</small>}
        </div>
        {error && <div className="auth-alert" role="alert"><i className="bi bi-exclamation-circle" aria-hidden="true" />{error}</div>}
        <button className="auth-primary" type="submit" disabled={loading || mismatch}>
          {loading ? <><span className="auth-spinner" /> Đang tạo tài khoản...</> : <>Tạo tài khoản <i className="bi bi-arrow-right" aria-hidden="true" /></>}
        </button>
      </form>
      <div className="auth-divider"><span /> TÀI KHOẢN MIỄN PHÍ <span /></div>
      <p className="auth-switch">Đã có tài khoản? <Link href="/auth/login">Đăng nhập ngay <i className="bi bi-arrow-right-short" aria-hidden="true" /></Link></p>
      <p className="auth-note"><i className="bi bi-lock-fill" aria-hidden="true" /> Thông tin tài khoản được lưu trữ bảo mật.</p>
    </AuthShell>
  );
}
