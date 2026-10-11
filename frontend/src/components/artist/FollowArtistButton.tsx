"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  artistId: string;
  onFollowChanged?: (following: boolean) => void;
}

export default function FollowArtistButton({ artistId, onFollowChanged }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setFollowing(false);
    setChecking(true);
    setError("");

    async function checkStatus() {
      try {
        const response = await fetch(`/api/follows/singers/${artistId}/status`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        // Trang nghệ sĩ là công khai; khách vẫn thấy được nút Follow.
        if (response.status === 401) return;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result: { following?: boolean } = await response.json();
        if (!controller.signal.aborted) setFollowing(Boolean(result.following));
      } catch (cause) {
        if (!controller.signal.aborted) {
          console.error("[Artist/Follow status]", cause);
          setError("Chưa tải được trạng thái theo dõi");
        }
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }

    void checkStatus();
    return () => controller.abort();
  }, [artistId]);

  async function toggle() {
    if (checking || pending) return;
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/follows/singers/${artistId}`, {
        method: following ? "DELETE" : "PUT",
        credentials: "same-origin",
      });
      if (response.status === 401) {
        const next = window.location.pathname + window.location.search;
        router.push(`/auth/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: { following?: boolean } = await response.json();
      const nextState = Boolean(result.following);
      if (nextState !== following) {
        setFollowing(nextState);
        onFollowChanged?.(nextState);
      }
    } catch (cause) {
      console.error("[Artist/Follow]", cause);
      setError("Không thể thay đổi theo dõi. Hãy thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={checking || pending}
        aria-pressed={following}
        className={`rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
          following
            ? "border border-[#414141] bg-[#1b1b1b] text-white hover:bg-[#272727]"
            : "bg-[#4ade80] text-[#07120a] hover:bg-[#86efac]"
        }`}
      >
        <i className={`bi ${following ? "bi-person-check-fill" : "bi-person-plus"} mr-2`} />
        {checking ? "Đang kiểm tra..." : pending ? "Đang xử lý..." : following ? "Đang theo dõi" : "Theo dõi nghệ sĩ"}
      </button>
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
