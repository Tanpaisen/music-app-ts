import { MeiliSearch } from "meilisearch";

// MongoDB is authoritative. Meilisearch is a derived search index.
// NEVER expose MEILI_ADMIN_KEY or direct private playlist searches to the browser.
const host = () => (process.env.MEILI_HOST || "http://127.0.0.1:7700").trim();
export const getMeiliClient = () => new MeiliSearch({
  host: host(),
  apiKey: process.env.MEILI_ADMIN_KEY?.trim(),
});

export const getSongIndex = () => getMeiliClient().index("songs");
export const getArtistIndex = () => getMeiliClient().index("artists");
export const getTopicIndex = () => getMeiliClient().index("topics");
export const getPlaylistIndex = () => getMeiliClient().index("playlists");

type Kind = "songs" | "artists" | "topics" | "playlists";
const SETTINGS: Record<Kind, { searchableAttributes: string[]; filterableAttributes: string[] }> = {
  songs: { searchableAttributes: ["title", "fullName", "slug"], filterableAttributes: ["status", "deleted"] },
  artists: { searchableAttributes: ["fullName", "slug"], filterableAttributes: ["status", "deleted"] },
  topics: { searchableAttributes: ["title", "description", "slug"], filterableAttributes: ["status", "deleted", "categoryKey"] },
  playlists: { searchableAttributes: ["name", "description"], filterableAttributes: ["userId"] },
};

const ready = new Map<Kind, Promise<void>>();
export async function ensureMeiliIndex(kind: Kind): Promise<void> {
  if (!ready.has(kind)) {
    const job = (async () => {
      const client = getMeiliClient();
      try {
        await client.getIndex(kind);
      } catch (error: any) {
        if (error?.code !== "index_not_found" && error?.httpStatus !== 404) throw error;
        const create = await client.createIndex(kind, { primaryKey: "id" });
        const task = await client.waitForTask(create.taskUid, { timeOutMs: 120000 });
        if (task.status !== "succeeded" && task.error?.code !== "index_already_exists") {
          throw new Error(`Cannot create Meili index ${kind}: ${task.error?.message}`);
        }
      }
      const index = client.index(kind);
      const task = await index.updateSettings({
        ...SETTINGS[kind],
        typoTolerance: { minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
      });
      const result = await client.waitForTask(task.taskUid, { timeOutMs: 120000 });
      if (result.status !== "succeeded") throw new Error(`Settings ${kind}: ${result.error?.message}`);
    })();
    ready.set(kind, job);
    job.catch(() => { if (ready.get(kind) === job) ready.delete(kind); });
  }
  await ready.get(kind);
}

async function upsert(kind: Kind, document: Record<string, unknown> | null, id: string) {
  await ensureMeiliIndex(kind);
  const index = getMeiliClient().index(kind);
  const task = document ? await index.addDocuments([document]) : await index.deleteDocument(id);
  const finished = await getMeiliClient().waitForTask(task.taskUid, { timeOutMs: 120000 });
  if (finished.status !== "succeeded") throw new Error(`Index ${kind}: ${finished.error?.message}`);
}

const songDoc = (song: any, singer: any) => ({
  id: String(song._id), title: song.title ?? "", slug: song.slug ?? "",
  avatar: song.avatar ?? "", like: song.like ?? 0, listen: song.listen ?? 0,
  singerId: song.singerId ? String(song.singerId) : null,
  fullName: singer?.fullName ?? "", status: song.status ?? "", deleted: Boolean(song.deleted),
});
const artistDoc = (s: any) => ({ id: String(s._id), fullName: s.fullName ?? "", slug: s.slug ?? "", avatar: s.avatar ?? "", status: s.status ?? "", deleted: Boolean(s.deleted) });
const topicDoc = (t: any) => ({ id: String(t._id), title: t.title ?? "", slug: t.slug ?? "", avatar: t.avatar ?? "", description: t.description ?? "", categoryKey: t.categoryKey ?? "khac", status: t.status ?? "", deleted: Boolean(t.deleted) });
const playlistDoc = (p: any) => ({ id: String(p._id), userId: String(p.userId), name: p.name ?? "", description: p.description ?? "", songCount: p.songIds?.length ?? 0 });

export async function refreshSong(id: string) {
  const { default: Song } = await import("../models/song.model");
  const { default: Singer } = await import("../models/singer.model");
  const song = await Song.findById(id).lean();
  if (!song || song.deleted || song.status !== "active") return upsert("songs", null, id);
  const singer = song.singerId ? await Singer.findById(song.singerId).lean() : null;
  return upsert("songs", songDoc(song, singer), id);
}
export async function refreshArtist(id: string) {
  const { default: Singer } = await import("../models/singer.model");
  const { default: Song } = await import("../models/song.model");
  const singer = await Singer.findById(id).lean();
  await upsert("artists", singer && !singer.deleted && singer.status === "active" ? artistDoc(singer) : null, id);
  // Re-index songs using this singer, since "fullName" is denormalized in the song index.
  const songs = await Song.find({ singerId: id }).select("_id").lean();
  for (const song of songs) await refreshSong(String(song._id));
}
export async function refreshTopic(id: string) {
  const { default: Topic } = await import("../models/topic.model");
  const topic = await Topic.findById(id).lean();
  return upsert("topics", topic && !topic.deleted && topic.status === "active" ? topicDoc(topic) : null, id);
}
export async function refreshPlaylist(id: string) {
  const { default: Playlist } = await import("../models/playlist.model");
  const playlist = await Playlist.findById(id).lean();
  return upsert("playlists", playlist ? playlistDoc(playlist) : null, id);
}

// Search index failures must not roll back successful MongoDB writes.
// Failures are visible in logs and can be repaired with the full-sync command.
export function scheduleMeiliRefresh(label: string, task: () => Promise<unknown>) {
  void task().catch(error => console.error(`[Meili refresh: ${label}]`, error));
}

async function replaceDocuments(kind: Kind, documents: any[]) {
  await ensureMeiliIndex(kind);
  const client = getMeiliClient();
  const index = client.index(kind);
  // Full rebuild ONLY on explicit npm run meili:sync, never on every user request/startup.
  const deletion = await index.deleteAllDocuments();
  const deleted = await client.waitForTask(deletion.taskUid, { timeOutMs: 120000 });
  if (deleted.status !== "succeeded") throw new Error(`${kind}: clear failed: ${deleted.error?.message}`);
  for (let i = 0; i < documents.length; i += 500) {
    const task = await index.addDocuments(documents.slice(i, i + 500));
    const result = await client.waitForTask(task.taskUid, { timeOutMs: 120000 });
    if (result.status !== "succeeded") throw new Error(`${kind}: import failed: ${result.error?.message}`);
  }
  console.log(`[Meili] ${kind}: ${documents.length} indexed`);
}

/** Explicit maintenance command. Will briefly interrupt search while each index is rebuilt. */
export async function syncAllToMeili() {
  const { default: Song } = await import("../models/song.model");
  const { default: Singer } = await import("../models/singer.model");
  const { default: Topic } = await import("../models/topic.model");
  const { default: Playlist } = await import("../models/playlist.model");
  const [songs, singers, topics, playlists] = await Promise.all([
    Song.find({ deleted: false, status: "active" }).lean(),
    Singer.find({ deleted: false, status: "active" }).lean(),
    Topic.find({ deleted: false, status: "active" }).lean(),
    Playlist.find({}).lean(),
  ]);
  const singerMap = new Map(singers.map(s => [String(s._id), s]));
  await replaceDocuments("artists", singers.map(artistDoc));
  await replaceDocuments("topics", topics.map(topicDoc));
  await replaceDocuments("songs", songs.map(s => songDoc(s, singerMap.get(String(s.singerId)))));
  await replaceDocuments("playlists", playlists.map(playlistDoc));
}

// Backward compatibility for any old call sites that only used song sync.
// IMPORTANT: no destructive sync on server boot; run `npm run meili:sync` once instead.
export async function syncSongsToMeili() {
  await Promise.all((Object.keys(SETTINGS) as Kind[]).map(ensureMeiliIndex));
  console.log("[Meili] indexes ready. Run npm run meili:sync to seed/rebuild data.");
}
