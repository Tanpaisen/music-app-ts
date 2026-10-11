"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaylistIndex = exports.getTopicIndex = exports.getArtistIndex = exports.getSongIndex = exports.getMeiliClient = void 0;
exports.ensureMeiliIndex = ensureMeiliIndex;
exports.refreshSong = refreshSong;
exports.refreshArtist = refreshArtist;
exports.refreshTopic = refreshTopic;
exports.refreshPlaylist = refreshPlaylist;
exports.scheduleMeiliRefresh = scheduleMeiliRefresh;
exports.syncAllToMeili = syncAllToMeili;
exports.syncSongsToMeili = syncSongsToMeili;
const meilisearch_1 = require("meilisearch");
const host = () => (process.env.MEILI_HOST || "http://127.0.0.1:7700").trim();
const getMeiliClient = () => { var _a; return new meilisearch_1.MeiliSearch({
    host: host(),
    apiKey: (_a = process.env.MEILI_ADMIN_KEY) === null || _a === void 0 ? void 0 : _a.trim(),
}); };
exports.getMeiliClient = getMeiliClient;
const getSongIndex = () => (0, exports.getMeiliClient)().index("songs");
exports.getSongIndex = getSongIndex;
const getArtistIndex = () => (0, exports.getMeiliClient)().index("artists");
exports.getArtistIndex = getArtistIndex;
const getTopicIndex = () => (0, exports.getMeiliClient)().index("topics");
exports.getTopicIndex = getTopicIndex;
const getPlaylistIndex = () => (0, exports.getMeiliClient)().index("playlists");
exports.getPlaylistIndex = getPlaylistIndex;
const SETTINGS = {
    songs: { searchableAttributes: ["title", "fullName", "slug"], filterableAttributes: ["status", "deleted"] },
    artists: { searchableAttributes: ["fullName", "slug"], filterableAttributes: ["status", "deleted"] },
    topics: { searchableAttributes: ["title", "description", "slug"], filterableAttributes: ["status", "deleted"] },
    playlists: { searchableAttributes: ["name", "description"], filterableAttributes: ["userId"] },
};
const ready = new Map();
function ensureMeiliIndex(kind) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ready.has(kind)) {
            const job = (() => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                const client = (0, exports.getMeiliClient)();
                try {
                    yield client.getIndex(kind);
                }
                catch (error) {
                    if ((error === null || error === void 0 ? void 0 : error.code) !== "index_not_found" && (error === null || error === void 0 ? void 0 : error.httpStatus) !== 404)
                        throw error;
                    const create = yield client.createIndex(kind, { primaryKey: "id" });
                    const task = yield client.waitForTask(create.taskUid, { timeOutMs: 120000 });
                    if (task.status !== "succeeded" && ((_a = task.error) === null || _a === void 0 ? void 0 : _a.code) !== "index_already_exists") {
                        throw new Error(`Cannot create Meili index ${kind}: ${(_b = task.error) === null || _b === void 0 ? void 0 : _b.message}`);
                    }
                }
                const index = client.index(kind);
                const task = yield index.updateSettings(Object.assign(Object.assign({}, SETTINGS[kind]), { typoTolerance: { minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } } }));
                const result = yield client.waitForTask(task.taskUid, { timeOutMs: 120000 });
                if (result.status !== "succeeded")
                    throw new Error(`Settings ${kind}: ${(_c = result.error) === null || _c === void 0 ? void 0 : _c.message}`);
            }))();
            ready.set(kind, job);
            job.catch(() => { if (ready.get(kind) === job)
                ready.delete(kind); });
        }
        yield ready.get(kind);
    });
}
function upsert(kind, document, id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield ensureMeiliIndex(kind);
        const index = (0, exports.getMeiliClient)().index(kind);
        const task = document ? yield index.addDocuments([document]) : yield index.deleteDocument(id);
        const finished = yield (0, exports.getMeiliClient)().waitForTask(task.taskUid, { timeOutMs: 120000 });
        if (finished.status !== "succeeded")
            throw new Error(`Index ${kind}: ${(_a = finished.error) === null || _a === void 0 ? void 0 : _a.message}`);
    });
}
const songDoc = (song, singer) => { var _a, _b, _c, _d, _e, _f, _g; return ({
    id: String(song._id), title: (_a = song.title) !== null && _a !== void 0 ? _a : "", slug: (_b = song.slug) !== null && _b !== void 0 ? _b : "",
    avatar: (_c = song.avatar) !== null && _c !== void 0 ? _c : "", like: (_d = song.like) !== null && _d !== void 0 ? _d : 0, listen: (_e = song.listen) !== null && _e !== void 0 ? _e : 0,
    singerId: song.singerId ? String(song.singerId) : null,
    fullName: (_f = singer === null || singer === void 0 ? void 0 : singer.fullName) !== null && _f !== void 0 ? _f : "", status: (_g = song.status) !== null && _g !== void 0 ? _g : "", deleted: Boolean(song.deleted),
}); };
const artistDoc = (s) => { var _a, _b, _c, _d; return ({ id: String(s._id), fullName: (_a = s.fullName) !== null && _a !== void 0 ? _a : "", slug: (_b = s.slug) !== null && _b !== void 0 ? _b : "", avatar: (_c = s.avatar) !== null && _c !== void 0 ? _c : "", status: (_d = s.status) !== null && _d !== void 0 ? _d : "", deleted: Boolean(s.deleted) }); };
const topicDoc = (t) => { var _a, _b, _c, _d, _e; return ({ id: String(t._id), title: (_a = t.title) !== null && _a !== void 0 ? _a : "", slug: (_b = t.slug) !== null && _b !== void 0 ? _b : "", avatar: (_c = t.avatar) !== null && _c !== void 0 ? _c : "", description: (_d = t.description) !== null && _d !== void 0 ? _d : "", status: (_e = t.status) !== null && _e !== void 0 ? _e : "", deleted: Boolean(t.deleted) }); };
const playlistDoc = (p) => { var _a; var _b, _c, _d; return ({ id: String(p._id), userId: String(p.userId), name: (_b = p.name) !== null && _b !== void 0 ? _b : "", description: (_c = p.description) !== null && _c !== void 0 ? _c : "", songCount: (_d = (_a = p.songIds) === null || _a === void 0 ? void 0 : _a.length) !== null && _d !== void 0 ? _d : 0 }); };
function refreshSong(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const { default: Song } = yield Promise.resolve().then(() => __importStar(require("../models/song.model")));
        const { default: Singer } = yield Promise.resolve().then(() => __importStar(require("../models/singer.model")));
        const song = yield Song.findById(id).lean();
        if (!song || song.deleted || song.status !== "active")
            return upsert("songs", null, id);
        const singer = song.singerId ? yield Singer.findById(song.singerId).lean() : null;
        return upsert("songs", songDoc(song, singer), id);
    });
}
function refreshArtist(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const { default: Singer } = yield Promise.resolve().then(() => __importStar(require("../models/singer.model")));
        const { default: Song } = yield Promise.resolve().then(() => __importStar(require("../models/song.model")));
        const singer = yield Singer.findById(id).lean();
        yield upsert("artists", singer && !singer.deleted && singer.status === "active" ? artistDoc(singer) : null, id);
        const songs = yield Song.find({ singerId: id }).select("_id").lean();
        for (const song of songs)
            yield refreshSong(String(song._id));
    });
}
function refreshTopic(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const { default: Topic } = yield Promise.resolve().then(() => __importStar(require("../models/topic.model")));
        const topic = yield Topic.findById(id).lean();
        return upsert("topics", topic && !topic.deleted && topic.status === "active" ? topicDoc(topic) : null, id);
    });
}
function refreshPlaylist(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const { default: Playlist } = yield Promise.resolve().then(() => __importStar(require("../models/playlist.model")));
        const playlist = yield Playlist.findById(id).lean();
        return upsert("playlists", playlist ? playlistDoc(playlist) : null, id);
    });
}
function scheduleMeiliRefresh(label, task) {
    void task().catch(error => console.error(`[Meili refresh: ${label}]`, error));
}
function replaceDocuments(kind, documents) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        yield ensureMeiliIndex(kind);
        const client = (0, exports.getMeiliClient)();
        const index = client.index(kind);
        const deletion = yield index.deleteAllDocuments();
        const deleted = yield client.waitForTask(deletion.taskUid, { timeOutMs: 120000 });
        if (deleted.status !== "succeeded")
            throw new Error(`${kind}: clear failed: ${(_a = deleted.error) === null || _a === void 0 ? void 0 : _a.message}`);
        for (let i = 0; i < documents.length; i += 500) {
            const task = yield index.addDocuments(documents.slice(i, i + 500));
            const result = yield client.waitForTask(task.taskUid, { timeOutMs: 120000 });
            if (result.status !== "succeeded")
                throw new Error(`${kind}: import failed: ${(_b = result.error) === null || _b === void 0 ? void 0 : _b.message}`);
        }
        console.log(`[Meili] ${kind}: ${documents.length} indexed`);
    });
}
function syncAllToMeili() {
    return __awaiter(this, void 0, void 0, function* () {
        const { default: Song } = yield Promise.resolve().then(() => __importStar(require("../models/song.model")));
        const { default: Singer } = yield Promise.resolve().then(() => __importStar(require("../models/singer.model")));
        const { default: Topic } = yield Promise.resolve().then(() => __importStar(require("../models/topic.model")));
        const { default: Playlist } = yield Promise.resolve().then(() => __importStar(require("../models/playlist.model")));
        const [songs, singers, topics, playlists] = yield Promise.all([
            Song.find({ deleted: false, status: "active" }).lean(),
            Singer.find({ deleted: false, status: "active" }).lean(),
            Topic.find({ deleted: false, status: "active" }).lean(),
            Playlist.find({}).lean(),
        ]);
        const singerMap = new Map(singers.map(s => [String(s._id), s]));
        yield replaceDocuments("artists", singers.map(artistDoc));
        yield replaceDocuments("topics", topics.map(topicDoc));
        yield replaceDocuments("songs", songs.map(s => songDoc(s, singerMap.get(String(s.singerId)))));
        yield replaceDocuments("playlists", playlists.map(playlistDoc));
    });
}
function syncSongsToMeili() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all(Object.keys(SETTINGS).map(ensureMeiliIndex));
        console.log("[Meili] indexes ready. Run npm run meili:sync to seed/rebuild data.");
    });
}
