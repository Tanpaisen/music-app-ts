import { HomeResponse, Song, Topic } from "@/types/home";

// URL tới backend Express thật.
// Đặt trong .env.local: API_BASE_URL=http://localhost:<port>
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

const EMPTY_HOME: HomeResponse["data"] = {
  featured: [],
  topTracks: [],
  newReleases: [],
};

/**
 * Gọi GET /home (routes/client/home.route.ts -> home.controller.ts -> home.service.ts).
 * Trả về { featured, topTracks, newReleases } đúng schema Song/Topic thật.
 */
export async function getHomeData(): Promise<HomeResponse["data"]> {
  try {
    const res = await fetch(`${API_BASE_URL}/home`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Fetch lỗi ${res.status}: /home`);
    const json = (await res.json()) as HomeResponse;
    return json.data ?? EMPTY_HOME;
  } catch (err) {
    console.error("[getHomeData]", err);
    return EMPTY_HOME;
  }
}

export async function getTopTracks(): Promise<Song[]> {
  const data = await getHomeData();
  return data.topTracks;
}

export async function getNewReleases(): Promise<Song[]> {
  const data = await getHomeData();
  return data.newReleases;
}

export async function getFeaturedTopics(): Promise<Topic[]> {
  const data = await getHomeData();
  return data.featured;
}
