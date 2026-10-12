export type AlbumSinger = { _id: string; fullName: string; slug: string; avatar?: string } | null;
export type AlbumSummary = {
  _id: string; title: string; slug: string; avatar: string;
  description: string; releaseDate: string | null; singer: AlbumSinger; songCount: number;
};
export type AlbumTrack = {
  _id: string; title: string; slug: string; avatar: string;
  audio: string | null; listen: number; like: number; singer: AlbumSinger;
};
export type AlbumDetail = Omit<AlbumSummary, "songCount">;
export type Paged<T> = { code: number; data: T; pagination: { page: number; limit: number; total: number; totalPages: number } };
