import { Request, Response } from "express";
import mongoose from "mongoose";
import { getMeiliClient, getSongIndex, ensureMeiliIndex } from "../../services/meilisearch.service";

const MIN_QUERY = 2;
const queryText = (req: Request) =>
  (typeof req.query.keyword === "string" ? req.query.keyword : "").trim().slice(0, 100);

const toSong = (s: any) => ({
  _id: String(s.id), title: s.title, slug: s.slug, avatar: s.avatar,
  listen: s.listen ?? 0, like: s.like ?? 0,
  singer: { fullName: s.fullName ?? "" },
});

// GET /search/all?keyword=... ; All categories search via Meilisearch only.
export const all = async (req: Request, res: Response): Promise<void> => {
  const keyword = queryText(req);
  if (keyword.length < MIN_QUERY) {
    res.status(400).json({ code: "QUERY_TOO_SHORT", message: "Nhập ít nhất 2 ký tự" });
    return;
  }
  try {
    const userId = req.session?.clientUserId;
    const authenticated = Boolean(userId && mongoose.isValidObjectId(userId));
    await Promise.all(["songs", "artists", "topics", "playlists"].map(kind =>
      ensureMeiliIndex(kind as "songs" | "artists" | "topics" | "playlists")
    ));
    const client = getMeiliClient();
    // A private playlist MUST be filtered on the SERVER with an authenticated session ID.
    // Never accept a userId from request query/body and never return the raw owner field.
    const [songs, artists, topics, playlists] = await Promise.all([
      client.index("songs").search(keyword, { filter: 'deleted = false AND status = "active"', limit: 20 }),
      client.index("artists").search(keyword, { filter: 'deleted = false AND status = "active"', limit: 12 }),
      client.index("topics").search(keyword, { filter: 'deleted = false AND status = "active"', limit: 12 }),
      authenticated
        ? client.index("playlists").search(keyword, { filter: `userId = "${userId}"`, limit: 20 })
        : Promise.resolve({ hits: [] as any[] }),
    ]);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({
      code: 200,
      data: {
        songs: songs.hits.map(toSong),
        artists: artists.hits.map((a: any) => ({ _id: a.id, fullName: a.fullName, slug: a.slug, avatar: a.avatar })),
        topics: topics.hits.map((t: any) => ({ _id: t.id, title: t.title, slug: t.slug, avatar: t.avatar })),
        playlists: playlists.hits.map((p: any) => ({ id: p.id, name: p.name, description: p.description, songCount: p.songCount })),
      },
      loginRequired: !authenticated,
    });
  } catch (error) {
    console.error("[search/all]", error);
    res.status(503).json({ code: "SEARCH_UNAVAILABLE", message: "Meilisearch chưa sẵn sàng hoặc chưa đồng bộ index" });
  }
};

// GET /search/suggest?keyword=... (backward-compatible response for existing search widgets)
export const type = async (req: Request, res: Response) => {
  const keyword = queryText(req);
  if (req.params.typeSearch !== "suggest" && req.params.typeSearch !== "result") {
    return res.status(400).json({ code: 400, message: "Loại tìm kiếm không hợp lệ" });
  }
  try {
    if (keyword.length < MIN_QUERY) return res.json({ code: 200, songDetail: [], artists: [] });
    await ensureMeiliIndex("songs");
    const result = await getSongIndex().search(keyword, {
      filter: 'deleted = false AND status = "active"', limit: 20,
    });
    const songDetail = result.hits.map(toSong);
    if (req.params.typeSearch === "result") {
      return res.render("client/pages/search/result", {
        pageTitle: `Kết quả tìm kiếm: ${keyword}`, keyword, songs: songDetail,
      });
    }
    return res.json({ code: 200, message: "Gợi ý tìm kiếm", songDetail });
  } catch (error) {
    console.error("[search/suggest]", error);
    return res.status(503).json({ code: 503, message: "Meilisearch chưa sẵn sàng" });
  }
};
