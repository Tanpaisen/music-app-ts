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
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeService = void 0;
const song_repository_1 = require("../repositories/song.repository");
const topic_repository_1 = require("../repositories/topic.repository");
const singer_repository_1 = require("../repositories/singer.repository");
function enrichSongs(rawSongs) {
    return __awaiter(this, void 0, void 0, function* () {
        const singerIds = [...new Set(rawSongs.map((s) => s.singerId).filter(Boolean))];
        const topicIds = [...new Set(rawSongs.map((s) => s.topicId).filter(Boolean))];
        const [singers, topics] = yield Promise.all([
            singer_repository_1.singerRepository.findByIds(singerIds),
            topic_repository_1.topicRepository.findByIds(topicIds),
        ]);
        const singerMap = new Map(singers.map((s) => [String(s._id), s]));
        const topicMap = new Map(topics.map((t) => [String(t._id), t]));
        return rawSongs.map((song) => {
            var _a, _b;
            const singer = singerMap.get(String(song.singerId));
            const topic = topicMap.get(String(song.topicId));
            const singerSummary = singer
                ? { fullName: singer.fullName, slug: singer.slug }
                : null;
            const topicSummary = topic
                ? { _id: String(topic._id), title: topic.title, slug: topic.slug }
                : null;
            return {
                _id: String(song._id),
                title: song.title,
                avatar: song.avatar,
                slug: song.slug,
                like: (_a = song.like) !== null && _a !== void 0 ? _a : 0,
                listen: (_b = song.listen) !== null && _b !== void 0 ? _b : 0,
                createdAt: song.createdAt,
                singer: singerSummary,
                topic: topicSummary,
            };
        });
    });
}
exports.homeService = {
    getDashboardData() {
        return __awaiter(this, void 0, void 0, function* () {
            const [featuredTopics, rawTopTracks, rawNewReleases] = yield Promise.all([
                topic_repository_1.topicRepository.findFeatured(4),
                song_repository_1.songRepository.findTopByListen(10),
                song_repository_1.songRepository.findLatest(8),
            ]);
            const [topTracks, newReleases] = yield Promise.all([
                enrichSongs(rawTopTracks),
                enrichSongs(rawNewReleases),
            ]);
            return {
                featured: featuredTopics.map((t) => ({
                    _id: String(t._id),
                    title: t.title,
                    slug: t.slug,
                    avatar: t.avatar,
                    description: t.description,
                })),
                topTracks,
                newReleases,
            };
        });
    },
};
