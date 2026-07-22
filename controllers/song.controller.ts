import { Request, Response } from "express";

//[GET] /songs/:songSlug
export const list = async (req: Request, res: Response) => {
    const slug = req.params.songSlug;

    res.render("client/pages/songs/list");
}