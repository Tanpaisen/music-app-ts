import { Request, Response } from "express";
import Song from "../models/song.model";
import Topic from "../models/topic.model";
import Singer from "../models/singer.model";

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

    console.log("Song detail:", song);

    res.render("client/pages/songs/detail", {
        pageTitle: "Chi tiết bài hát",
        song: song,
        singer: singer,
        topic: topic
    });
}