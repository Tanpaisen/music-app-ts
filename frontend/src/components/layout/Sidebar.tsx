import Link from "next/link";

const navItems = [
  { label: "Trang chủ", href: "/", icon: "bi-house-door-fill" },
  { label: "Tìm kiếm", href: "/search", icon: "bi-search" },
  { label: "Thư viện", href: "/library", icon: "bi-collection-play" },
  { label: "Playlist của tôi", href: "/playlists", icon: "bi-music-note-list" },
  { label: "Nghệ sĩ theo dõi", href: "/following", icon: "bi-person-check" },
  { label: "Đã thích", href: "/liked", icon: "bi-heart" },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 border-r border-line bg-panel/60 px-6 py-8">
      <Link href="/" className="mb-1 block">
        <span className="font-display text-2xl tracking-tight text-ink">Tmus</span>
      </Link>
      <p className="mb-10 text-xs tracking-[0.2em] text-muted uppercase">Nghe theo cách của bạn</p>

      <nav className="flex flex-col gap-1">
        {navItems.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              i === 0
                ? "bg-raised text-ink"
                : "text-muted hover:bg-raised/60 hover:text-ink"
            }`}
          >
            <i className={`bi ${item.icon} text-base ${i === 0 ? "text-amber" : ""}`} />
            {item.label}
          </Link>
        ))}
      </nav>

      <Link
        href="/playlists/new"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-amber px-4 py-2.5 text-sm font-medium text-base transition-transform hover:scale-[1.02]"
      >
        <i className="bi bi-plus-lg" />
        Tạo playlist
      </Link>

      <div className="mt-auto flex flex-col gap-1 pt-8 text-sm text-muted">
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-raised/60 hover:text-ink">
          <i className="bi bi-gear" /> Cài đặt
        </Link>
        <Link href="/support" className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-raised/60 hover:text-ink">
          <i className="bi bi-question-circle" /> Hỗ trợ
        </Link>
      </div>
    </aside>
  );
}
