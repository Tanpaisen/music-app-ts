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
    var _a;
    const host = (process.env.MEILI_HOST || 'http://localhost:7700').trim();
    const apiKey = (_a = process.env.MEILI_ADMIN_KEY) === null || _a === void 0 ? void 0 : _a.trim();
    return new meilisearch_1.MeiliSearch({ host, apiKey });
};
exports.getMeiliClient = getMeiliClient;
const getSongIndex = () => (0, exports.getMeiliClient)().index('songs');
exports.getSongIndex = getSongIndex;
const withRetry = (label_1, fn_1, ...args_1) => __awaiter(void 0, [label_1, fn_1, ...args_1], void 0, function* (label, fn, tries = 6) {
    for (let i = 1;; i++) {
        try {
            return yield fn();
        }
        catch (e) {
            if (i >= tries)
                throw e;
            console.log(`⏳ [Meilisearch] ${label}: ${e === null || e === void 0 ? void 0 : e.message} - thử lại ${i}/${tries - 1} sau 10s...`);
            yield new Promise((r) => setTimeout(r, 10000));
        }
    }
});
const syncSongsToMeili = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    var _d, _e;
    let step = 'bắt đầu';
    try {
        const client = (0, exports.getMeiliClient)();
        const songIndex = (0, exports.getSongIndex)();
        console.log('[Meilisearch] host =', process.env.MEILI_HOST);
        step = 'health';
        yield withRetry('health', () => client.health());
        step = 'createIndex';
        console.log('1. tạo index (nếu chưa có)...');
        const createTask = yield withRetry('createIndex', () => client.createIndex('songs', { primaryKey: 'id' }));
        yield withRetry('waitCreate', () => client.waitForTask(createTask.taskUid, { timeOutMs: 60000 }));
        step = 'updateIndex';
        console.log('2. ép primaryKey = id...');
        const pkTask = yield withRetry('updateIndex', () => client.updateIndex('songs', { primaryKey: 'id' }));
        const pkDone = yield withRetry('waitPk', () => client.waitForTask(pkTask.taskUid, { timeOutMs: 60000 }));
        if (pkDone.status !== 'succeeded')
            console.warn('⚠️ updateIndex:', (_a = pkDone.error) === null || _a === void 0 ? void 0 : _a.message);
        step = 'settings';
        console.log('3. cập nhật settings...');
        const settingsTasks = yield withRetry('settings', () => Promise.all([
            songIndex.updateTypoTolerance({ minWordSizeForTypos: { oneTypo: 3, twoTypos: 7 } }),
            songIndex.updateFilterableAttributes(['deleted', 'status']),
            songIndex.updateSearchableAttributes(['title', 'fullName', 'slug']),
        ]));
        yield withRetry('waitSettings', () => songIndex.waitForTasks(settingsTasks.map((t) => t.taskUid), { timeOutMs: 60000 }));
        step = 'mongo';
        console.log('4. lấy dữ liệu MongoDB + thêm documents...');
        const songs = yield song_model_1.default.find({ deleted: false, status: 'active' }).populate('singerId');
        const documents = songs.map((song) => { var _a, _b, _c; var _d, _e, _f, _g, _h, _j; return ({
            id: song._id.toString(),
            title: song.title,
            slug: song.slug,
            status: song.status,
            deleted: song.deleted,
            avatar: (_d = song.avatar) !== null && _d !== void 0 ? _d : '',
            like: (_e = song.like) !== null && _e !== void 0 ? _e : 0,
            listen: (_f = song.listen) !== null && _f !== void 0 ? _f : 0,
            audio: (_g = song.audio) !== null && _g !== void 0 ? _g : null,
            singerId: (_h = (_b = (_a = song.singerId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _h !== void 0 ? _h : null,
            fullName: (_j = (_c = song.singerId) === null || _c === void 0 ? void 0 : _c.fullName) !== null && _j !== void 0 ? _j : '',
        }); });
        step = 'addDocuments';
        const clearTask = yield withRetry('deleteAll', () => songIndex.deleteAllDocuments());
        yield withRetry('waitClear', () => songIndex.waitForTask(clearTask.taskUid, { timeOutMs: 60000 }));
        if (documents.length === 0) {
            console.log('ℹ️ [Meilisearch] Không có dữ liệu bài hát để đồng bộ.');
            return;
        }
        const addTask = yield withRetry('addDocuments', () => songIndex.addDocuments(documents, { primaryKey: 'id' }));
        const done = yield withRetry('waitAdd', () => songIndex.waitForTask(addTask.taskUid, { timeOutMs: 60000 }));
        if (done.status !== 'succeeded') {
            console.error('❌ [Meilisearch] addDocuments THẤT BẠI:', done.error);
            return;
        }
        const stats = yield songIndex.getStats();
        console.log(`✅ [Meilisearch] Index hiện có ${stats.numberOfDocuments} bài hát (đã gửi ${documents.length})`);
    }
    catch (error) {
        console.error(`❌ Lỗi sync Meilisearch ở bước "${step}":`, (error === null || error === void 0 ? void 0 : error.message) || error);
        console.error('   code:', error === null || error === void 0 ? void 0 : error.code, '| status:', (_d = error === null || error === void 0 ? void 0 : error.httpStatus) !== null && _d !== void 0 ? _d : (_b = error === null || error === void 0 ? void 0 : error.cause) === null || _b === void 0 ? void 0 : _b.status, '| cause:', (_e = (_c = error === null || error === void 0 ? void 0 : error.cause) === null || _c === void 0 ? void 0 : _c.message) !== null && _e !== void 0 ? _e : error === null || error === void 0 ? void 0 : error.cause);
    }
});
exports.syncSongsToMeili = syncSongsToMeili;
