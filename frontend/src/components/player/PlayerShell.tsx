"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import PlayerBar from "@/components/layout/PlayerBar";
import { usePlayer } from "./PlayerProvider";

/**
 * Keep the detail route aligned with track changes triggered by Next/Previous/
 * autoplay, while leaving other pages (home/search/etc.) undisturbed.
 * This component must stay mounted inside PlayerProvider.
 */
export default function PlayerShell({ children }: { children: ReactNode }) {
  const { track } = usePlayer();
  const pathname = usePathname();
  const router = useRouter();
  const previousTrackId = useRef<string | null>(track?._id ?? null);

  const isSongDetail = pathname?.startsWith("/songs/detail/") ?? false;
  const showMiniPlayer = Boolean(track) && !isSongDetail;

  useEffect(() => {
    const oldId = previousTrackId.current;
    const newId = track?._id ?? null;
    previousTrackId.current = newId;

    // Only react to actual track transitions; navigating manually to another
    // detail page must not bounce users back to the song already playing.
    if (!oldId || !newId || oldId === newId || !track?.slug || !isSongDetail) {
      return;
    }

    const target = `/songs/detail/${encodeURIComponent(track.slug)}`;
    if (pathname !== target) {
      router.replace(target, { scroll: false });
    }
  }, [track?._id, track?.slug, pathname, isSongDetail, router]);

  return (
    <>
      <div className={showMiniPlayer ? "pb-36 sm:pb-28" : undefined}>
        {children}
      </div>
      {showMiniPlayer && <PlayerBar />}
    </>
  );
}
