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
exports.syncSongsToMeili = exports.getSongIndex = exports.getMeiliClient = void 0;
const meilisearch_1 = require("meilisearch");
const song_model_1 = __importDefault(require("../models/song.model"));
const getMeiliClient = () => {
    const host = process.env.MEILI_HOST || 'http://localhost:7700';
    const apiKey = process.env.MEILI_ADMIN_KEY || '12345678';
    return new meilisearch_1.MeiliSearch({ host, apiKey });
};
exports.getMeiliClient = getMeiliClient;
const getSongIndex = () => {
    const client = (0, exports.getMeiliClient)();
    return client.index('songs');
};
exports.getSongIndex = getSongIndex;
const syncSongsToMeili = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const songIndex = (0, exports.getSongIndex)();
        yield songIndex.updateTypoTolerance({ minWordSizeForTypos: { oneTypo: 3, twoTypos: 7 } });
        yield songIndex.updateFilterableAttributes(['deleted', 'status']);
        yield songIndex.updateSearchableAttributes(['title', 'fullName', 'slug']);
        const songs = yield song_model_1.default.find({
            deleted: false,
            status: 'active'
        }).populate('singerId');
        const documents = songs.map((song) => { var _a; return ({
            id: song._id.toString(),
            title: song.title,
            slug: song.slug,
            status: song.status,
            deleted: song.deleted,
            fullName: ((_a = song.singerId) === null || _a === void 0 ? void 0 : _a.fullName) || '',
            avatar: song.avatar,
        }); });
        yield songIndex.addDocuments(documents);
        console.log('✅ [Meilisearch] Đồng bộ dữ liệu thành công!');
    }
    catch (error) {
        console.error('❌ Lỗi sync Meilisearch:', error);
    }
});
exports.syncSongsToMeili = syncSongsToMeili;
