export interface SingerSummary {
  fullName: string;
  slug?: string;
}

export interface TopicSummary {
  _id: string;
  title: string;
  slug: string;
  avatar?: string;
  description?: string;
}

export interface SongSummary {
  _id: string;
  title: string;
  avatar: string;
  slug: string;
  like: number;
  listen: number;
  singer: SingerSummary | null;
  topic: TopicSummary | null;
  createdAt?: Date;
}

export interface DashboardData {
  featured: TopicSummary[];
  topTracks: SongSummary[];
  newReleases: SongSummary[];
}
