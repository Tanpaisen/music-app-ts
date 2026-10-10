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
exports.type = void 0;
const meilisearch_service_1 = require("../../services/meilisearch.service");
var typeSearch;
(function (typeSearch) {
    typeSearch["RESULT"] = "result";
    typeSearch["SUGGEST"] = "suggest";
})(typeSearch || (typeSearch = {}));
const type = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const type = req.params.typeSearch;
        const keyword = `${req.query.keyword || ""}`.trim();
        let songDetail = [];
        if (keyword) {
            const songIndex = (0, meilisearch_service_1.getSongIndex)();
            const searchResult = yield songIndex.search(keyword, {
                filter: ['deleted = false', 'status = "active"'],
                limit: 20,
            });
            songDetail = searchResult.hits.map((hit) => { var _a, _b; return ({
                _id: hit.id,
                avatar: hit.avatar,
                title: hit.title,
                like: (_a = hit.like) !== null && _a !== void 0 ? _a : 0,
                listen: (_b = hit.listen) !== null && _b !== void 0 ? _b : 0,
                slug: hit.slug,
                singer: {
                    fullName: hit.fullName || ""
                }
            }); });
        }
        switch (type) {
            case typeSearch.RESULT:
                return res.render("client/pages/search/result", {
                    pageTitle: `Kết quả tìm kiếm: ${keyword}`,
                    keyword: keyword,
                    songs: songDetail
                });
            case typeSearch.SUGGEST:
                return res.json({
                    code: 200,
                    message: "Gợi ý tìm kiếm",
                    songDetail: songDetail
                });
            default:
                return res.status(400).json({
                    code: 400,
                    message: "Loại tìm kiếm không hợp lệ"
                });
        }
    }
    catch (error) {
        console.error("❌ Lỗi controller search:", error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi hệ thống khi tìm kiếm"
        });
    }
});
exports.type = type;
