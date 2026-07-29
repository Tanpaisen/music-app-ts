import { Request, Response } from "express";
import Song from "../../models/song.model";
import Singer from "../../models/singer.model";
import Topic from "../../models/topic.model";



//[GET] /admin/topics
export const index = async (req: Request, res: Response) => {
    const songs = await Song.find({
        deleted: false,
    })

    res.render('admin/pages/songs/index', {
        pageTitle: "Trang quản lý bài hát",
        songs: songs
    })
}

//[GET] /admin/topics/create
export const create = async (req: Request, res: Response) => {
    const topics = await Topic.find({
        deleted: false,
    }).select('title')

    const singers = await Singer.find({
        deleted: false
    }).select("fullName")

    res.render('admin/pages/songs/create', {
        pageTitle: "Trang quản lý bài hát",
        topics: topics,
        singers: singers
    })
}

//[POST] /admin/topics/create
export const createPost = async (req: Request, res: Response) => {
    console.log(req.body)
    
    res.send("ok")
}