// Khớp đúng với response thật của GET /dashboard (controllers/client/dashboard.controller.ts)
// Song schema KHÔNG có "album" hay "duration" — thay bằng "topic" (từ topicId) và "listen".

export interface Singer {
  fullName: string;
  slug?: string;
}

export interface Topic {
  _id?: string;
  title: string;
  slug: string;
  avatar?: string;
  description?: string;
}

export interface Song {
  _id?: string;
  slug: string;
  title: string;
  avatar: string;
  like: number;
  listen: number;
  singer: Singer | null;
  topic: Topic | null;
  createdAt?: string;
}

export interface HomeResponse {
  code: number;
  message: string;
  data: {
    featured: Topic[];
    topTracks: Song[];
    newReleases: Song[];
  };
}
