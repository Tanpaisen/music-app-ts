import { Request, Response } from "express";
import Song from "../../models/song.model";
import Singer from "../../models/singer.model";
import unidecode from "unidecode"
import { getSongIndex } from "../../services/meilisearch.service"

enum typeSearch {
    RESULT = "result",
    SUGGEST = "suggest"
}

//[GET] /search/result
export const type = async (req: Request, res: Response) => {

    const type = req.params.typeSearch;
    const keyword: string = `${req.query.keyword}`;

    const songDetail = [];
    if (keyword) {
        const keywordRegex = new RegExp(keyword, 'i');
        const unidecodeKeyword = unidecode(keyword).trim()
        const keywordSlug = unidecodeKeyword.replace(/\s+/g, '-')
        const slugRegex = new RegExp(keywordSlug, 'i')

        const songs = await Song.find({
            deleted: false,
            status: "active",
            $or: [
                { title: keywordRegex },
                { slug: slugRegex }
            ]
        })

        for (const item of songs) {
            const singer = await Singer.findOne({
                _id: item.singerId,
                deleted: false,
                status: "active"
            })
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
            })
        }

        // Tìm kiếm tức thì qua Meilisearch
        // 1. Gọi hàm .search() của songIndex

        // const songIndex = getSongIndex();
        // const searchResult = await songIndex.search(keyword, {
        //     filter: ['deleted = false', 'status = "active"'],
        //     limit: 20,
        // });

        // songs = searchResult.hits;
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
                })
                break;
            default:
                break;
        }
    }


}
