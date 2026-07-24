import { Request, Response } from "express";
import Song from "../models/song.model";
import Topic from "../models/topic.model";
import Singer from "../models/singer.model";
import FavoriteSong from "../models/favorite.song.model";

//[GET] /songs/:songSlug
export const list = async (req: Request, res: Response) => {
    const slug = req.params.songSlug;

    if (!slug) {
        return res.status(400).json({ message: "Missing songSlug parameter" });
    }

    const topic = await Topic.findOne({
        slug: slug,
        deleted: false
    })

    if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
    }

    const songs = await Song.find({
        topicId: topic.id,
    })

    for (const song of songs) {
        const singer = await Singer.findById(song.singerId).select("fullName");
        song["singer"] = singer;
    }


    res.render("client/pages/songs/list", {
        pageTitle: "Danh sách bài hát",
        topic: topic,
        songs: songs
    });
}

//[GET] /songs/detail/:songSlug
export const detail = async (req: Request, res: Response) => {
    const slug = req.params.songSlug;
    if (!slug) {
        return res.status(400).json({ message: "Missing songSlug parameter" });
    }

    const song = await Song.findOne({
        slug: slug,
        deleted: false
    })

    if (!song) {
        return res.status(404).json({ message: "Song not found" });
    }

    const topic = await Topic.findById(song.topicId);

    const singer = await Singer.findById(song.singerId).select("fullName");

    const favorite = await FavoriteSong.findOne({
        songId: song.id,
        userId: "",
    })
    song['favorite'] = favorite

    res.render("client/pages/songs/detail", {
        pageTitle: "Chi tiết bài hát",
        song: song,
        singer: singer,
        topic: topic
    });
}

//[PATCH] /songs/like/:status/:songId
export const like = async (req: Request, res: Response) => {
    const songId = req.params.songId;
    const status = req.params.status;

    const song = await Song.findOne({
        _id: songId,
        deleted: false,
        status: "active"
    })
    const like = song.like;
    const newLike = status == "like" ? like + 1 : like - 1;

    await Song.updateOne({
        _id: songId,
        deleted: false,
        status: "active"
    }, {
        like: newLike
    })

    res.json({
        code: 200,
        message: "Thành công",
        like: newLike
    })
}

//[PATCH] /songs/favorite/:status/:songId
export const favorite = async (req: Request, res: Response) => {
    const id = req.params.songId;
    const status = req.params.status

    if(status == "favorite"){
        const favoriteSong = new FavoriteSong({
            songId: id,
            userId: "",
        })
        await favoriteSong.save();
    }
    else{
        await FavoriteSong.deleteOne({
            songId: id,
            userId: "",
        })
    }

    res.json({
        code: 200,
        message: status == "favorite" ? "Đã thêm vào yêu thích" : "Đã xóa yêu thích"
    })
}