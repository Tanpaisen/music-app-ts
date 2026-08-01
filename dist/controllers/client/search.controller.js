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
exports.type = void 0;
const song_model_1 = __importDefault(require("../../models/song.model"));
const singer_model_1 = __importDefault(require("../../models/singer.model"));
const unidecode_1 = __importDefault(require("unidecode"));
var typeSearch;
(function (typeSearch) {
    typeSearch["RESULT"] = "result";
    typeSearch["SUGGEST"] = "suggest";
})(typeSearch || (typeSearch = {}));
const type = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const type = req.params.typeSearch;
    const keyword = `${req.query.keyword}`;
    const songDetail = [];
    if (keyword) {
        const keywordRegex = new RegExp(keyword, 'i');
        const unidecodeKeyword = (0, unidecode_1.default)(keyword).trim();
        const keywordSlug = unidecodeKeyword.replace(/\s+/g, '-');
        const slugRegex = new RegExp(keywordSlug, 'i');
        const songs = yield song_model_1.default.find({
            deleted: false,
            status: "active",
            $or: [
                { title: keywordRegex },
                { slug: slugRegex }
            ]
        });
        for (const item of songs) {
            const singer = yield singer_model_1.default.findOne({
                _id: item.singerId,
                deleted: false,
                status: "active"
            });
            item["singer"] = singer;
            songDetail.push({
                _id: item.id,
                avatar: item.avatar,
                title: item.title,
                like: item.like,
                slug: item.slug,
                singer: {
                    fullName: singer.fullName
                },
            });
        }
        switch (type) {
            case typeSearch.RESULT:
                res.render("client/pages/search/result", {
                    pageTitle: `Kết quả tìm kiếm: ${keyword}`,
                    songs: songs
                });
                break;
            case typeSearch.SUGGEST:
                res.json({
                    code: 200,
                    message: "Gợi ý tìm kiếm",
                    songDetail: songDetail
                });
                break;
            default:
                break;
        }
    }
});
exports.type = type;
