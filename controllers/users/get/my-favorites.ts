import { Request, Response } from 'express';
import Barber from '../../../models/Barber';
import mongoose from 'mongoose';

export default async function(req: Request, res: Response) {
    const { userId, page, limit } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;

    if(!userId) {
        return void res.status(400).json({ error: 'Please pass a valid userId string', ok: false });
    }
   
    try {
        const user = await Barber.findById(String(userId));
        if(!user) {
            return void res.status(404).json({ error: 'Could not find a user with the given id', ok: false })
        }
        const { myFavorites } = user;
        const favorites = await Barber.find({ _id: { $in: myFavorites }});
        res.status(200).json({ favorites: favorites ?? [], currentPage: pageNum, limit: limitNum, ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: '', ok: false })
    }
}