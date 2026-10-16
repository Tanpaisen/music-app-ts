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
  { label: "Album", href: "/albums", icon: "bi-vinyl" },
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    const controller = new AbortController();
    void checkAuth(controller.signal);
    setMobileOpen(false);
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

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem("tmus:sidebar-collapsed") === "true");
    } catch {
      // Trình duyệt có thể chặn localStorage; Sidebar vẫn hoạt động bình thường.
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const toggleDesktop = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("tmus:sidebar-collapsed", String(next));
      } catch {
        // Không bắt buộc phải lưu trạng thái.
      }
      return next;
    });
  };

  const navClass = (href: string, compact: boolean) => {
    const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    return `group flex min-h-[42px] items-center gap-3 rounded-lg py-2.5 text-sm transition-colors ${compact ? "justify-center px-2" : "px-3"} ${
      active ? "bg-raised text-ink" : "text-muted hover:bg-raised/60 hover:text-ink"
    }`;
  };

  const renderNav = (compact: boolean, onNavigate?: () => void) => (
    <>
      <nav className="flex flex-col gap-1" aria-label="Điều hướng chính">
        {publicItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={navClass(item.href, compact)}
            title={compact ? item.label : undefined}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <i className={`bi ${item.icon} shrink-0 text-lg`} aria-hidden="true" />
            <span className={compact ? "sr-only" : "truncate"}>{item.label}</span>
          </Link>
        ))}

        {auth === "member" && (
          <>
            <div className="my-4 border-t border-line" />
            {!compact && <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-widest text-muted">Cá nhân</p>}
            {privateItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={navClass(item.href, compact)}
                title={compact ? item.label : undefined}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <i className={`bi ${item.icon} shrink-0 text-lg`} aria-hidden="true" />
                <span className={compact ? "sr-only" : "truncate"}>{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {auth === "member" && (
        <Link
          href="/playlists/new"
          onClick={onNavigate}
          title={compact ? "Tạo playlist" : undefined}
          className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-amber py-2.5 text-sm font-medium text-[#171717] transition-transform hover:scale-[1.02] ${compact ? "px-2" : "px-4"}`}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" />
          <span className={compact ? "sr-only" : ""}>Tạo playlist</span>
        </Link>
      )}

      {auth === "guest" && (
        compact ? (
          <Link
            href="/auth/login"
            onClick={onNavigate}
            className="mt-8 flex h-10 items-center justify-center rounded-full bg-amber text-[#171717]"
            title="Đăng nhập"
            aria-label="Đăng nhập"
          >
            <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
          </Link>
        ) : (
          <div className="mt-8 rounded-xl border border-line bg-raised/40 p-3">
            <p className="mb-3 text-xs leading-relaxed text-muted">Đăng nhập để lưu nhạc, tạo playlist và theo dõi ca sĩ.</p>
            <Link href="/auth/login" onClick={onNavigate} className="flex items-center justify-center gap-2 rounded-full bg-amber px-4 py-2.5 text-sm font-medium text-[#171717]">
              <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Đăng nhập
            </Link>
          </div>
        )
      )}

      {auth === "checking" && <p className="mt-6 px-2 text-center text-xs text-muted" role="status">{compact ? "…" : "Đang kiểm tra tài khoản..."}</p>}
      {auth === "error" && (
        <button type="button" className="mt-6 px-2 text-xs text-muted underline hover:text-ink" onClick={() => void checkAuth()} title="Thử kiểm tra đăng nhập lại">
          {compact ? "!" : "Chưa thể kiểm tra phiên đăng nhập. Thử lại"}
        </button>
      )}

      {auth === "member" && displayName && !compact && (
        <div className="mt-auto min-w-0 pt-8 text-xs text-muted">
          Đang đăng nhập: <span className="block truncate font-medium text-ink">{displayName}</span>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop: nút ba gạch thu gọn/mở rộng thanh bên. */}
      <aside
        className={`hidden shrink-0 flex-col overflow-y-auto border-r border-line bg-panel/60 py-6 transition-[width,padding] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen ${collapsed ? "lg:w-[76px] lg:px-3" : "lg:w-64 lg:px-6"}`}
      >
        <div className={`mb-7 flex items-center ${collapsed ? "flex-col gap-3" : "justify-between gap-2"}`}>
          <Link href="/" className="min-w-0" title="Trang chủ Tmus">
            <span className="font-display text-2xl tracking-tight text-ink">{collapsed ? "T" : "Tmus"}</span>
            {!collapsed && <span className="mt-1 block whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-muted">Nghe theo cách của bạn</span>}
          </Link>
          <button
            type="button"
            onClick={toggleDesktop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
            aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            aria-expanded={!collapsed}
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            <i className="bi bi-list text-xl" aria-hidden="true" />
          </button>
        </div>
        {renderNav(collapsed)}
      </aside>

      {/* Mobile: Sidebar ẩn mặc định, nút ba gạch mở menu trượt. */}
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-3 top-3 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-panel text-ink shadow-lg lg:hidden"
          aria-label="Mở menu điều hướng"
          aria-controls="tmus-mobile-sidebar"
          aria-expanded={false}
        >
          <i className="bi bi-list text-2xl" aria-hidden="true" />
        </button>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
            tabIndex={-1}
          />
          <aside
            id="tmus-mobile-sidebar"
            className="absolute inset-y-0 left-0 flex w-[min(85vw,290px)] flex-col overflow-y-auto border-r border-line bg-panel px-6 py-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng Tmus"
          >
            <div className="mb-8 flex items-center justify-between">
              <Link href="/" onClick={() => setMobileOpen(false)} className="font-display text-2xl text-ink">Tmus</Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink"
                aria-label="Đóng menu"
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>
            {renderNav(false, () => setMobileOpen(false))}
          </aside>
        </div>
      )}
    </>
  );
}
