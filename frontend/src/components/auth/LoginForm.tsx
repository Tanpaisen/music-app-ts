"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SonicCanvas from "./SonicCanvas";
import EqBars from "./EqBars";

// Vinyl nhỏ trang trí — animate rotate
function MiniVinyl() {
  return (
    <div
      className="relative mx-auto mt-5 h-[88px] w-[88px] rounded-full"
      style={{
        background:
          "conic-gradient(#0d0d0d 0deg,#1a1a1a 10deg,#0d0d0d 20deg,#1a1a1a 30deg,#0d0d0d 40deg,#1a1a1a 50deg,#0d0d0d 60deg,#1a1a1a 70deg,#0d0d0d 80deg,#1a1a1a 90deg,#0d0d0d 100deg,#1a1a1a 110deg,#0d0d0d 120deg,#1a1a1a 130deg,#0d0d0d 140deg,#1a1a1a 150deg,#0d0d0d 160deg,#1a1a1a 170deg,#0d0d0d 180deg,#1a1a1a 190deg,#0d0d0d 200deg,#1a1a1a 210deg,#0d0d0d 220deg,#1a1a1a 230deg,#0d0d0d 240deg,#1a1a1a 250deg,#0d0d0d 260deg,#1a1a1a 270deg,#0d0d0d 280deg,#1a1a1a 290deg,#0d0d0d 300deg,#1a1a1a 310deg,#0d0d0d 320deg,#1a1a1a 330deg,#0d0d0d 340deg,#1a1a1a 350deg,#0d0d0d 360deg)",
        boxShadow: "0 0 28px rgba(74,222,128,0.18), 0 0 56px rgba(74,222,128,0.06)",
        animation: "spin 4s linear infinite",
      }}
      aria-hidden="true"
    >
      {/* Lỗ giữa */}
      <div
        className="absolute left-1/2 top-1/2 h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#050508]"
        style={{ boxShadow: "0 0 0 2px rgba(74,222,128,0.25)" }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Đăng nhập thất bại");
        router.push("/");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [email, password, router]
  );

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#050508]">

      {/* ── Cột trái: Visual sonic ── */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden lg:flex lg:w-1/2">
        <SonicCanvas />

        {/* Nội dung trên canvas */}
        <div className="relative z-10 px-10 text-center">
          {/* Logo */}
          <h1
            className="text-[48px] font-extrabold leading-none tracking-[-2px]"
            style={{
              background: "linear-gradient(135deg,#4ade80 0%,#22d3ee 50%,#a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
            }}
          >
            TMU
          </h1>
          <p className="mt-2 text-[11px] tracking-[3px] text-white/20">SONIC UNIVERSE</p>

          {/* Vinyl */}
          <MiniVinyl />

          <p className="mx-auto mt-6 max-w-[180px] text-[12px] leading-relaxed text-white/20">
            Hàng triệu bài hát.<br />Một trải nghiệm duy nhất.
          </p>
        </div>

        {/* Vòng trang trí */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.025]" />
      </div>

      {/* Divider dọc */}
      <div className="hidden w-px bg-white/[0.04] lg:block" />

      {/* ── Cột phải: Form ── */}
      <div className="relative flex w-full flex-col justify-center overflow-hidden bg-[#080810] px-8 py-12 lg:w-1/2 lg:px-16">
        {/* Glow tím góc trên */}
        <div
          className="pointer-events-none absolute right-[-60px] top-[-60px] h-[200px] w-[200px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(167,139,250,0.07) 0%,transparent 70%)" }}
        />
        {/* Glow cyan góc dưới */}
        <div
          className="pointer-events-none absolute bottom-[-40px] left-[-40px] h-[160px] w-[160px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(34,211,238,0.05) 0%,transparent 70%)" }}
        />

        <div className="relative z-10 w-full max-w-[360px] lg:mx-auto">

          {/* Logo nhỏ trên mobile */}
          <div className="mb-8 text-center lg:hidden">
            <span
              className="text-[32px] font-extrabold tracking-[-1px]"
              style={{
                background: "linear-gradient(135deg,#4ade80,#22d3ee,#a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              TMU
            </span>
          </div>

          {/* EQ bars + heading */}
          <EqBars />
          <h2 className="text-[22px] font-bold text-white">Chào mừng trở lại</h2>
          <p className="mb-7 mt-1 text-[13px] text-white/30">
            Đăng nhập để tiếp tục nghe nhạc
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-white/35">Email / Username</label>
              <div className="relative">
                <i className="bi bi-person absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-white/20" aria-hidden="true" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or username"
                  required
                  className="w-full rounded-lg py-3 pl-9 pr-4 text-[13px] outline-none transition-all"
                  style={{
                    background: "#0c0c18",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                    color: "#cccccc",
                    borderRadius: "10px",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(74,222,128,0.06)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-white/35">Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] text-[#a78bfa]/70 transition-colors hover:text-[#a78bfa]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <i className="bi bi-lock absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-white/20" aria-hidden="true" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full py-3 pl-9 pr-10 text-[13px] outline-none transition-all"
                  style={{
                    background: "#0c0c18",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                    color: "#cccccc",
                    borderRadius: "10px",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(74,222,128,0.06)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-white/25 transition-colors hover:text-white/60"
                  aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <i className={`bi ${showPass ? "bi-eye" : "bi-eye-slash"}`} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-400">
                <i className="bi bi-exclamation-circle mr-1.5" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative mt-1 w-full overflow-hidden rounded-xl py-3.5 text-[14px] font-bold text-[#050508] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg,#4ade80 0%,#22d3ee 50%,#a78bfa 100%)",
              }}
            >
              {/* Shimmer overlay */}
              <span
                className="pointer
                events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%)",
                }}
              />
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="bi bi-arrow-repeat animate-spin" />
                  Đang kết nối...
                </span>
              ) : (
                "Log In"
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.05]" />
              <span className="text-[10px] tracking-[2px] text-white/20">OR CONTINUE WITH</span>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>

            {/* Social */}
            <div className="flex gap-3">
              {/* Google */}
              <button
                type="button"
                className="flex flex-1 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] py-3 transition-all hover:border-white/[0.15] hover:bg-white/[0.05]"
                aria-label="Đăng nhập bằng Google"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </button>

              {/* QR */}
              <button
                type="button"
                className="flex flex-1 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] py-3 text-[16px] text-white/30 transition-all hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white/60"
                aria-label="Đăng nhập bằng QR Code"
              >
                <i className="bi bi-qr-code" />
              </button>

              {/* SSO */}
              <button
                type="button"
                className="flex flex-1 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] py-3 text-[16px] text-white/30 transition-all hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white/60"
                aria-label="Đăng nhập SSO"
              >
                <i className="bi bi-box-arrow-in-down" />
              </button>
            </div>
          </form>

          <p className="mt-7 text-center text-[12px] text-white/25">
            Chưa có tài khoản?{" "}
            <Link href="/auth/register" className="font-semibold text-[#4ade80] transition-colors hover:text-[#86efac]">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
