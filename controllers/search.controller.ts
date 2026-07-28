import { Request, Response } from "express";
import Song from "../models/song.model";
import Singer from "../models/singer.model";
import unidecode from "unidecode"
import { getSongIndex } from "../services/meilisearch.service"

//[GET] /search/result
export const result = async (req: Request, res: Response) => {

    const keyword: string = `${req.query.keyword}`;

    let songs = [];
    if (keyword) {
        // const keywordRegex = new RegExp(keyword, 'i');
        // const unidecodeKeyword = unidecode(keyword).trim()
        // const keywordSlug = unidecodeKeyword.replace(/\s+/g, '-')
        // const slugRegex = new RegExp(keywordSlug, 'i')

        // songs = await Song.find({
        //     deleted: false,
        //     status: "active",
        //     $or: [
        //         { title: keywordRegex },
        //         { slug: slugRegex }
        //     ]
        // })

        // for (const item of songs) {
        //     const singer = await Singer.findOne({
        //         _id: item.singerId,
        //         deleted: false,
        //         status: "active"
        //     })
        //     item.singer = singer;
        // }

        // Tìm kiếm tức thì qua Meilisearch
        // 1. Gọi hàm .search() của songIndex
        const songIndex = getSongIndex();
        const searchResult = await songIndex.search(keyword, {
            filter: ['deleted = false', 'status = "active"'],
            limit: 20,
        });

        console.log(searchResult)
        // songs = searchResult.hits;
    }
    console.log(songs)
    res.render("client/pages/search/result", {
        pageTitle: `Kết quả tìm kiếm: ${keyword}`,
        songs: songs
    });
}
