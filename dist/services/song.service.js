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
exports.songService = void 0;
const song_repository_1 = require("../repositories/song.repository");
const singer_repository_1 = require("../repositories/singer.repository");
const topic_repository_1 = require("../repositories/topic.repository");
exports.songService = {
    getSongDetail(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            const raw = yield song_repository_1.songRepository.findBySlug(slug);
            if (!raw)
                return null;
            const singerIds = raw.singerId ? [String(raw.singerId)] : [];
            const topicIds = raw.topicId ? [String(raw.topicId)] : [];
            const [singers, topics, rawRelated] = yield Promise.all([
                singer_repository_1.singerRepository.findByIds(singerIds),
                topic_repository_1.topicRepository.findByIds(topicIds),
                raw.topicId != null
                    ? song_repository_1.songRepository.findRelated(String(raw.topicId), slug, 5)
                    : Promise.resolve([]),
            ]);
            const singer = (_a = singers[0]) !== null && _a !== void 0 ? _a : null;
            const topic = (_b = topics[0]) !== null && _b !== void 0 ? _b : null;
            const relatedSingerIds = [...new Set(rawRelated.map((s) => String(s.singerId)).filter(Boolean))];
            const relatedSingers = yield singer_repository_1.singerRepository.findByIds(relatedSingerIds);
            const singerMap = new Map(relatedSingers.map((s) => [String(s._id), s]));
            const related = rawRelated.map((s) => {
                var _a, _b;
                const rs = singerMap.get(String(s.singerId));
                return {
                    _id: String(s._id),
                    title: s.title,
                    avatar: s.avatar,
                    slug: s.slug,
                    like: (_a = s.like) !== null && _a !== void 0 ? _a : 0,
                    listen: (_b = s.listen) !== null && _b !== void 0 ? _b : 0,
                    singer: rs ? { fullName: rs.fullName, slug: rs.slug } : null,
                };
            });
            return {
                song: {
                    _id: String(raw._id),
                    title: (_c = raw.title) !== null && _c !== void 0 ? _c : "",
                    avatar: (_d = raw.avatar) !== null && _d !== void 0 ? _d : "",
                    slug: (_e = raw.slug) !== null && _e !== void 0 ? _e : "",
                    like: (_f = raw.like) !== null && _f !== void 0 ? _f : 0,
                    listen: (_g = raw.listen) !== null && _g !== void 0 ? _g : 0,
                    audio: (_h = raw.audio) !== null && _h !== void 0 ? _h : null,
                    lyrics: (_j = raw.lyrics) !== null && _j !== void 0 ? _j : null,
                    description: (_k = raw.description) !== null && _k !== void 0 ? _k : null,
                    createdAt: raw.createdAt,
                    singer: singer
                        ? {
                            _id: String(singer._id),
                            fullName: (_l = singer.fullName) !== null && _l !== void 0 ? _l : "",
                            slug: (_m = singer.slug) !== null && _m !== void 0 ? _m : undefined,
                        }
                        : null,
                    topic: topic
                        ? {
                            _id: String(topic._id),
                            title: (_o = topic.title) !== null && _o !== void 0 ? _o : "",
                            slug: (_p = topic.slug) !== null && _p !== void 0 ? _p : "",
                            avatar: (_q = topic.avatar) !== null && _q !== void 0 ? _q : undefined,
                        }
                        : null,
                },
                related,
            };
        });
    },
};
