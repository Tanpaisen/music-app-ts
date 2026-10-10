import { SongDetailResponse } from "@/types/song";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

export async function getSongDetail(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/songs/detail/${slug}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`Fetch lỗi ${res.status}`);
    const json = (await res.json()) as SongDetailResponse;
    return json.data ?? null;
  } catch (err) {
    console.error("[getSongDetail]", err);
    return null;
  }
}
