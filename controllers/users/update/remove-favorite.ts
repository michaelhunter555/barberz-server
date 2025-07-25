import { Request, Response } from 'express';
import User from '../../../models/Barber';
import myFavorites from '../get/my-favorites';

export default async function(req: Request, res: Response) {
    const {userId, barberIds } = req.body;

    if(!userId || barberIds.length === 0) {
        return void res.status(400).json({ error: 'Please pass valid barber and user id', ok: false })
    }

    try {
    const user = await User.findByIdAndUpdate(
        String(userId),
        { $pull: { myFavorites: { $in: barberIds } } },
        { new: true }
    );

    if(!user){
        return void res.status(404).json({ error: 'Barber or user could not be found', ok: false })
    }
    
    res.status(200).json({ newList: user?.myFavorites ?? [], ok: true });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'An error has occured', ok: false });
    }

}