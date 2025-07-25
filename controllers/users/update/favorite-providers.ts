import { Request, Response } from 'express';
import User from '../../../models/Barber';
import mongoose from 'mongoose';

export default async function(req: Request, res: Response) {
    const { userId, barberId } = req.body;

    if(!userId || !barberId) {
        return void res.status(400).json({ error: 'Please pass valid barber and user id', ok: false })
    }

    try {
    const user = await User.findById(String(userId))

    if(!user){
        return void res.status(404).json({ error: 'Barber or user could not be found', ok: false })
    }
    
    const barber = new mongoose.Types.ObjectId(String(barberId))

    // if(user.myFavorites.includes(barber)){
    //     return void res.status(400).json({error: '' })
    // }
    
    user.myFavorites.push(barberId);
    await user.save();
    
    res.status(200).json({ newFavoriteId: barberId, ok: true });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'An error has occured', ok: false });
    }

}