"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.type = exports.all = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const meilisearch_service_1 = require("../../services/meilisearch.service");
const MIN_QUERY = 2;
const queryText = (req) => (typeof req.query.keyword === "string" ? req.query.keyword : "").trim().slice(0, 100);
const toSong = (s) => { var _a, _b, _c; return ({
    _id: String(s.id), title: s.title, slug: s.slug, avatar: s.avatar,
    listen: (_a = s.listen) !== null && _a !== void 0 ? _a : 0, like: (_b = s.like) !== null && _b !== void 0 ? _b : 0,
    singer: { fullName: (_c = s.fullName) !== null && _c !== void 0 ? _c : "" },
}); };
const all = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const keyword = queryText(req);
    if (keyword.length < MIN_QUERY) {
        res.status(400).json({ code: "QUERY_TOO_SHORT", message: "Nhập ít nhất 2 ký tự" });
        return;
    }
    try {
        const userId = (_a = req.session) === null || _a === void 0 ? void 0 : _a.clientUserId;
        const authenticated = Boolean(userId && mongoose_1.default.isValidObjectId(userId));
        yield Promise.all(["songs", "artists", "topics", "playlists"].map(kind => (0, meilisearch_service_1.ensureMeiliIndex)(kind)));
        const client = (0, meilisearch_service_1.getMeiliClient)();
        const [songs, artists, topics, playlists] = yield Promise.all([
            client.index("songs").search(keyword, { filter: 'deleted = false AND status = "active"', limit: 20 }),
            client.index("artists").search(keyword, { filter: 'deleted = false AND status = "active"', limit: 12 }),
            client.index("topics").search(keyword, { filter: 'deleted = false AND status = "active"', limit: 12 }),
            authenticated
                ? client.index("playlists").search(keyword, { filter: `userId = "${userId}"`, limit: 20 })
                : Promise.resolve({ hits: [] }),
        ]);
        res.setHeader("Cache-Control", "private, no-store");
        res.json({
            code: 200,
            data: {
                songs: songs.hits.map(toSong),
                artists: artists.hits.map((a) => ({ _id: a.id, fullName: a.fullName, slug: a.slug, avatar: a.avatar })),
                topics: topics.hits.map((t) => ({ _id: t.id, title: t.title, slug: t.slug, avatar: t.avatar })),
                playlists: playlists.hits.map((p) => ({ id: p.id, name: p.name, description: p.description, songCount: p.songCount })),
            },
            loginRequired: !authenticated,
        });
    }
    catch (error) {
        console.error("[search/all]", error);
        res.status(503).json({ code: "SEARCH_UNAVAILABLE", message: "Meilisearch chưa sẵn sàng hoặc chưa đồng bộ index" });
    }
});
exports.all = all;
const type = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const keyword = queryText(req);
    if (req.params.typeSearch !== "suggest" && req.params.typeSearch !== "result") {
        return res.status(400).json({ code: 400, message: "Loại tìm kiếm không hợp lệ" });
    }
    try {
        if (keyword.length < MIN_QUERY)
            return res.json({ code: 200, songDetail: [], artists: [] });
        yield (0, meilisearch_service_1.ensureMeiliIndex)("songs");
        const result = yield (0, meilisearch_service_1.getSongIndex)().search(keyword, {
            filter: 'deleted = false AND status = "active"', limit: 20,
        });
        const songDetail = result.hits.map(toSong);
        if (req.params.typeSearch === "result") {
            return res.render("client/pages/search/result", {
                pageTitle: `Kết quả tìm kiếm: ${keyword}`, keyword, songs: songDetail,
            });
        }
        return res.json({ code: 200, message: "Gợi ý tìm kiếm", songDetail });
    }
    catch (error) {
        console.error("[search/suggest]", error);
        return res.status(503).json({ code: 503, message: "Meilisearch chưa sẵn sàng" });
    }
});
exports.type = type;
