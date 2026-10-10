
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const q = keyword.trim();
    if (!q) return;

    router.push(`/search?keyword=${encodeURIComponent(q)}`);
  };

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-5 lg:px-10">
      <form
        onSubmit={handleSearch}
        className="relative w-full max-w-md"
        role="search"
      >
        <button
          type="submit"
          aria-label="Tìm kiếm"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        >
          <i className="bi bi-search text-sm" />
        </button>

        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm nghệ sĩ, bài hát, playlist..."
          className="w-full rounded-full border border-line bg-panel px-11 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-amber/60"
        />
      </form>

      <div className="flex items-center gap-4">
        <button className="hidden sm:inline-flex items-center gap-2 rounded-full border border-amber/40 px-4 py-2 text-xs font-medium tracking-wide text-amber transition-colors hover:bg-amber/10">
          Nâng cấp Premium
        </button>

        <button className="relative text-muted hover:text-ink" aria-label="Thông báo">
          <i className="bi bi-bell text-lg" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-coral" />
        </button>

        <div className="h-9 w-9 overflow-hidden rounded-full bg-raised ring-1 ring-line" />
      </div>
    </header>
  );
}
