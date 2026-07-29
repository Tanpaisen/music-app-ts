import { Request, Response } from "express";
import Song from "../../models/song.model";
import Singer from "../../models/singer.model";
import Topic from "../../models/topic.model";
import { systemConfig } from "../../config/system";



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
    if(req.body.avatar) {
        req.body.avatar = req.body.avatar[0]
    }
    if(req.body.audio) {
        req.body.audio = req.body.audio[0]
    }
    const data = {
        title: req.body.title,
        avatar: req.body.avatar,
        description: req.body.description,
        singerId: req.body.singerId,
        topicId: req.body.topicId,
        status: req.body.status,
        audio: req.body.audio
    }
    const song = new Song(data);
    await song.save();
    res.redirect(`/${systemConfig.prefixAdmin}/songs/create`)
}