"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AuthState = "checking" | "guest" | "member" | "error";

const publicItems = [
  { label: "Trang chủ", href: "/", icon: "bi-house-door-fill" },
  { label: "Tìm kiếm", href: "/search", icon: "bi-search" },
  { label: "Ca sĩ", href: "/artists", icon: "bi-mic" },
  { label: "Chủ đề", href: "/topics", icon: "bi-grid-1x2" },
];

const privateItems = [
  { label: "Thư viện", href: "/library", icon: "bi-collection-play" },
  { label: "Playlist của tôi", href: "/playlists", icon: "bi-music-note-list" },
  { label: "Nghệ sĩ theo dõi", href: "/following", icon: "bi-person-check" },
  { label: "Đã thích", href: "/liked", icon: "bi-heart" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState>("checking");
  const [displayName, setDisplayName] = useState("");

  const checkAuth = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });
      if (signal?.aborted) return;
      if (response.status === 401) {
        setDisplayName("");
        setAuth("guest");
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: { user?: { id: string; fullName?: string } } = await response.json();
      if (signal?.aborted) return;
      if (!data.user?.id) throw new Error("Invalid session response");
      setDisplayName(data.user.fullName ?? "");
      setAuth("member");
    } catch (error) {
      if (signal?.aborted) return;
      console.error("[Sidebar] Cannot verify session:", error);
      setAuth("error");
    }
  }, []);

  // Kiểm tra lại khi chuyển trang (sau login/logout), quay về tab,
  // hoặc khi thành phần khác phát sự kiện tmus:auth-changed.
  useEffect(() => {
    const controller = new AbortController();
    void checkAuth(controller.signal);
    return () => controller.abort();
  }, [checkAuth, pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkAuth();
    };
    const onChanged = () => void checkAuth();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("tmus:auth-changed", onChanged);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("tmus:auth-changed", onChanged);
    };
  }, [checkAuth]);

  const navClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    return `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      active ? "bg-raised text-ink" : "text-muted hover:bg-raised/60 hover:text-ink"
    }`;
  };

  return (
    <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col border-r border-line bg-panel/60 px-6 py-8">
      <Link href="/" className="mb-1 block">
        <span className="font-display text-2xl tracking-tight text-ink">Tmus</span>
      </Link>
      <p className="mb-9 text-xs uppercase tracking-[0.2em] text-muted">Nghe theo cách của bạn</p>

      <nav className="flex flex-col gap-1" aria-label="Điều hướng chính">
        {publicItems.map((item) => (
          <Link key={item.href} href={item.href} className={navClass(item.href)} aria-current={pathname === item.href ? "page" : undefined}>
            <i className={`bi ${item.icon} text-base`} aria-hidden="true" />
            {item.label}
          </Link>
        ))}

        {auth === "member" && (
          <>
            <div className="my-4 border-t border-line" />
            <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-widest text-muted">Cá nhân</p>
            {privateItems.map((item) => (
              <Link key={item.href} href={item.href} className={navClass(item.href)} aria-current={pathname === item.href ? "page" : undefined}>
                <i className={`bi ${item.icon} text-base`} aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {auth === "member" && (
        <Link href="/playlists/new" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-amber px-4 py-2.5 text-sm font-medium text-[#171717] transition-transform hover:scale-[1.02]">
          <i className="bi bi-plus-lg" aria-hidden="true" /> Tạo playlist
        </Link>
      )}

      {auth === "guest" && (
        <div className="mt-8 rounded-xl border border-line bg-raised/40 p-3">
          <p className="mb-3 text-xs leading-relaxed text-muted">Đăng nhập để lưu nhạc, tạo playlist và theo dõi ca sĩ.</p>
          <Link href="/auth/login" className="flex items-center justify-center gap-2 rounded-full bg-amber px-4 py-2.5 text-sm font-medium text-[#171717]">
            <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Đăng nhập
          </Link>
        </div>
      )}

      {auth === "checking" && <p className="mt-6 px-3 text-xs text-muted" role="status">Đang kiểm tra tài khoản...</p>}
      {auth === "error" && <p className="mt-6 px-3 text-xs text-muted" role="status">Chưa thể kiểm tra phiên đăng nhập. <button type="button" className="underline hover:text-ink" onClick={() => void checkAuth()}>Thử lại</button></p>}

      {auth === "member" && displayName && (
        <div className="mt-auto min-w-0 pt-8 text-xs text-muted">
          Đang đăng nhập: <span className="block truncate font-medium text-ink">{displayName}</span>
        </div>
      )}
    </aside>
  );
}
