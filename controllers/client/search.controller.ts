import { Request, Response } from "express";
import { getSongIndex } from "../../services/meilisearch.service";

enum typeSearch {
    RESULT = "result",
    SUGGEST = "suggest"
}

// [GET] /search/:typeSearch
export const type = async (req: Request, res: Response) => {
    try {
        const type = req.params.typeSearch;
        const keyword: string = `${req.query.keyword || ""}`.trim();

        let songDetail: any[] = [];

        if (keyword) {
            const songIndex = getSongIndex();

            // 1. Tìm kiếm trực tiếp qua Meilisearch (Hỗ trợ tiếng Việt, gõ sai từ, gõ không dấu...)
            const searchResult = await songIndex.search(keyword, {
                filter: ['deleted = false', 'status = "active"'],
                limit: 20,
            });

            // 2. Format lại dữ liệu từ hits cho đồng nhất với View Pug & API JSON
            songDetail = searchResult.hits.map((hit: any) => ({
                _id: hit.id,
                avatar: hit.avatar,
                title: hit.title,
                like: hit.like ?? 0,
                listen: hit.listen ?? 0,
                slug: hit.slug,
                singer: {
                    fullName: hit.fullName || ""
                }
            }));
        }

        // 3. Trả về kết quả tùy thuộc vào endpoint (RESULT render giao diện, SUGGEST trả JSON)
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
    } catch (error) {
        console.error("❌ Lỗi controller search:", error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi hệ thống khi tìm kiếm"
        });
    }
};