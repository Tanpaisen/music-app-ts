import Link from "next/link";
import type { ReactNode } from "react";

const EQUALIZER_HEIGHTS = [30, 52, 35, 72, 45, 92, 64, 38, 75, 47, 100, 61, 82, 48, 75, 34, 93, 67, 38, 78, 53, 88, 33, 62, 47, 82, 57, 33];

export default function AuthShell({
  mode,
  children,
}: {
  mode: "login" | "register";
  children: ReactNode;
}) {
  const login = mode === "login";

  return (
    <div className="auth-root">
      <div className="auth-blur auth-blur--top" aria-hidden="true" />
      <div className="auth-blur auth-blur--bottom" aria-hidden="true" />
      <div className="auth-page">
        <aside className="auth-visual" aria-label="Không gian âm nhạc Tmus">
          <div className="auth-visual-top">
            <Link href="/" className="auth-brand" aria-label="Tmus - về trang chủ">
              <span className="auth-brand-mark"><i className="bi bi-soundwave" aria-hidden="true" /></span>
              <span>Tmus<span className="auth-brand-dot">.</span></span>
            </Link>
            <span className="auth-small-tag">ÂM NHẠC KHÔNG GIỚI HẠN</span>
          </div>

          <div className="auth-art">
            <div className="auth-art-glow" aria-hidden="true" />
            <div className="auth-record" aria-hidden="true">
              <div className="auth-record-sticker">
                <span className="auth-record-monogram">T</span>
                <span className="auth-record-disc-title">SIDE A · TMUS</span>
              </div>
            </div>
            <div className="auth-art-caption">
              <span className="auth-art-live"><span className="auth-live-dot" /> YOUR DAILY SOUNDTRACK</span>
              <span className="auth-art-line">PLAY IT LOUD.</span>
            </div>
            <div className="auth-track-card" aria-hidden="true">
              <span className="auth-track-cover"><i className="bi bi-music-note-beamed" /></span>
              <span className="auth-track-meta"><strong>Find your rhythm</strong><small>Tmus Originals · 2026</small></span>
              <span className="auth-track-status"><i className="bi bi-soundwave" /></span>
            </div>
          </div>

          <div className="auth-visual-bottom">
            <span className="auth-eyebrow"><span className="auth-eyebrow-dash" /> KHÔNG CHỈ LÀ ÂM NHẠC</span>
            <h2>
              Mỗi giai điệu<br />
              <em>một cảm xúc.</em>
            </h2>
            <p>Lưu lại bài hát yêu thích. Khám phá những âm thanh hợp với chính bạn.</p>
            <div className="auth-equalizer" aria-hidden="true">
              {EQUALIZER_HEIGHTS.map((height, index) => (
                <span key={index} style={{ height: `${height}%`, animationDelay: `${(index % 8) * -0.15}s` }} />
              ))}
            </div>
          </div>
        </aside>

        <main className="auth-main">
          <header className="auth-header">
            <Link href="/" className="auth-mobile-brand"><i className="bi bi-soundwave" /> Tmus<span>.</span></Link>
            <span className="auth-header-copy">{login ? "Chưa có tài khoản?" : "Đã là thành viên?"}</span>
            <Link className="auth-header-action" href={login ? "/auth/register" : "/auth/login"}>
              {login ? "Đăng ký" : "Đăng nhập"} <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
          </header>
          <section className="auth-panel" aria-label={login ? "Đăng nhập" : "Đăng ký"}>
            <div className="auth-panel-inner">{children}</div>
          </section>
          <footer className="auth-footer"><span>© 2026 Tmus</span><span>Nghe theo cách của bạn <i className="bi bi-heart-fill" aria-hidden="true" /></span></footer>
        </main>
      </div>
    </div>
  );
}
