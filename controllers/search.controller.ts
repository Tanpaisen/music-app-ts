import { Request, Response } from "express";
import Song from "../models/song.model";
import Singer from "../models/singer.model";

//[GET] /search/result
export const result = async (req: Request, res: Response) => {

    const keyword: string = `${req.query.keyword}`;

    let songs = [];
    if (keyword) {
        const keywordRegex = new RegExp(keyword, 'i');

        songs = await Song.find({
            deleted: false,
            title: keywordRegex,
            status: "active"
        })

        for (const item of songs) {
            const singer = await Singer.findOne({
                _id: item.singerId,
                deleted: false,
                status: "active"
            })
            item.singer = singer;
        }
    }
    res.render("client/pages/search/result", {
        pageTitle: `Kết quả tìm kiếm: ${keyword}`,
        songs: songs
    });
}
