import { Request, Response } from 'express';
import User from '../../../models/Barber';

export default async function(req: Request, res: Response) {
    const { userId, newName } = req.body;
    
    if(!userId || !newName) {
        return void res.status(400).json({ error: 'Please provide a name and user id', ok: false });
    }

    try {
        const user = await User.findByIdAndUpdate(userId, { name: newName });
       res.status(200).json({ name: user.name, ok: true, })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'An error has occured ' + err, ok: false })
    }
}