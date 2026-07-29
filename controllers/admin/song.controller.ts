import { Request, Response } from "express";
import Song from "../../models/song.model";



//[GET] /admin/topics
export const index = async (req: Request, res: Response) => {
    const songs = await Song.find({
        deleted: false,
    })

    res.render('admin/pages/songs/index',{
        pageTitle: "Trang quản lý bài hát",
        songs: songs
    })
}