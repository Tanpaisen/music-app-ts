// Thêm vào src/types/home.ts (hoặc tạo src/types/song.ts riêng)

export interface SongDetail {
  _id: string;
  title: string;
  avatar: string;
  slug: string;
  like: number;
  listen: number;
  audio: string | null;
  lyrics: string | null;
  description: string | null;
  createdAt?: string;
  singer: { _id: string; fullName: string; slug?: string } | null;
  topic: { _id: string; title: string; slug: string; avatar?: string } | null;
}

export interface SongSummary {
  _id: string;
  title: string;
  avatar: string;
  slug: string;
  like: number;
  listen: number;
  singer: { fullName: string; slug?: string } | null;
}

export interface SongDetailResponse {
  code: number;
  message: string;
  data: {
    song: SongDetail;
    related: SongSummary[];
  };
}
