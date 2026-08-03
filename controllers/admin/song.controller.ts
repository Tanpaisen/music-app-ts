import { Request, Response } from "express";
import Song from "../../models/song.model";
import Singer from "../../models/singer.model";
import Topic from "../../models/topic.model";
import { systemConfig } from "../../config/system";

interface SongData {
  title: any;
  description: any;
  singerId: any;
  topicId: any;
  status: any;
  lyrics: any;
  avatar?: any;
  audio?: any;
}


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
    const data: SongData = {
        title: req.body.title,
        avatar: req.body.avatar,
        description: req.body.description,
        singerId: req.body.singerId,
        topicId: req.body.topicId,
        status: req.body.status,
        audio: req.body.audio,
        lyrics: req.body.lyrics,
    }
    const song = new Song(data);
    await song.save();
    res.redirect(`/${systemConfig.prefixAdmin}/songs/create`)
}

//[GET] /admin/topics/edit/:id
export const edit = async (req: Request, res: Response) => {
    const id = req.params.id;
    const song = await Song.findOne({
        _id: id,
        deleted: false,
    })
    const topics = await Topic.find({
        deleted: false,
    }).select('title')

    const singers = await Singer.find({
        deleted: false
    }).select("fullName")

    res.render('admin/pages/songs/edit', {
        pageTitle: "Trang quản lý bài hát",
        topics: topics,
        singers: singers,
        song: song
    })
}

//[PATCH] /admin/topics/edit/:id
export const editPatch = async (req: Request, res: Response) => {
    const id = req.params.id;

    const data: SongData = {
        title: req.body.title,
        description: req.body.description,
        singerId: req.body.singerId,
        topicId: req.body.topicId,
        status: req.body.status,
        lyrics: req.body.lyrics,
    }

    if(req.body.avatar?.length > 0) {
        data['avatar'] = req.body.avatar[0]
    }
    if(req.body.audio?.length > 0) {
        data['audio'] = req.body.audio[0]
    }
    await Song.updateOne({
        _id: id,
        deleted: false
    },data)
    res.redirect(`/${systemConfig.prefixAdmin}/songs/edit/${id}`)
}